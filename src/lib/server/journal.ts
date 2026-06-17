import type { SupabaseClient } from "@supabase/supabase-js";
import { type AgentMessage, runAgent } from "@/lib/ai/agent";
import { generateEmbedding } from "@/lib/ai/embed";
import { inferMood } from "@/lib/ai/mood";
import { textToTiptapDoc } from "@/lib/ai/tiptap";
import { warsawDateKey } from "@/lib/date";

/** Błąd domenowy z kodem HTTP — mapowany na Response (REST) lub błąd narzędzia (MCP). */
export class JournalError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "JournalError";
  }
}

export type Ctx = { admin: SupabaseClient; userId: string };

const ENTRY_COLS = "id,date,mood,content_json,content_text,created_at,updated_at";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveDate(date: string | undefined, field = "date"): string {
  const d = date ?? warsawDateKey();
  if (!DATE_RE.test(d)) throw new JournalError(400, `\`${field}\` musi mieć format YYYY-MM-DD.`);
  return d;
}

/** Dodaje wpis (domyślnie dziś; mood opcjonalny → wnioskowany z treści przez AI). */
export async function createEntry(
  ctx: Ctx,
  input: { text?: string; date?: string; mood?: number },
) {
  const text = (input.text ?? "").trim();
  if (!text) throw new JournalError(400, "Pole `text` jest wymagane.");

  const date = resolveDate(input.date);

  let mood: number;
  if (input.mood === undefined || input.mood === null) {
    mood = await inferMood(text);
  } else if (Number.isInteger(input.mood) && input.mood >= 1 && input.mood <= 5) {
    mood = input.mood;
  } else {
    throw new JournalError(400, "`mood` musi być liczbą całkowitą 1–5.");
  }

  const { data, error } = await ctx.admin
    .from("entries")
    .insert({
      user_id: ctx.userId,
      date,
      mood,
      content_text: text,
      content_json: textToTiptapDoc(text),
    })
    .select(ENTRY_COLS)
    .single();

  if (error) {
    console.error("[journal.createEntry] error:", error);
    throw new JournalError(500, "Nie udało się zapisać wpisu.");
  }

  const embedding = await generateEmbedding(text);
  if (embedding) {
    await ctx.admin.from("entries").update({ embedding }).eq("id", data.id);
  }

  return data;
}

/** Wpisy z danego dnia (domyślnie dziś). */
export async function getDayEntries(ctx: Ctx, date?: string) {
  const d = resolveDate(date);
  const { data, error } = await ctx.admin
    .from("entries")
    .select(ENTRY_COLS)
    .eq("user_id", ctx.userId)
    .eq("date", d)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[journal.getDayEntries] error:", error);
    throw new JournalError(500, "Nie udało się pobrać wpisów.");
  }
  return { date: d, entries: data ?? [] };
}

/** Zapewnia czat: istniejący (z weryfikacją właściciela) albo nowy. */
async function ensureChat(ctx: Ctx, chatId: string | undefined, question: string) {
  if (chatId) {
    const { data: chat } = await ctx.admin
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", ctx.userId)
      .maybeSingle();
    if (!chat) throw new JournalError(404, "Czat nie istnieje lub brak dostępu.");

    const { data: msgs } = await ctx.admin
      .from("chat_messages")
      .select("role,text")
      .eq("chat_id", chatId)
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: true });

    const history = (msgs ?? []).map((m) => ({
      role: m.role as AgentMessage["role"],
      text: m.text as string,
    }));
    return { id: chatId, history };
  }

  const { data: created, error } = await ctx.admin
    .from("chats")
    .insert({ user_id: ctx.userId, title: question.slice(0, 60) })
    .select("id")
    .single();
  if (error || !created) throw new JournalError(500, "Nie udało się utworzyć czatu.");
  return { id: created.id as string, history: [] as AgentMessage[] };
}

/** Pytanie do agenta z kontekstem dnia, historią i zapisem do `chats`. */
export async function askAgent(
  ctx: Ctx,
  input: { question?: string; date?: string; chatId?: string },
) {
  if (!process.env.GEMINI_API_KEY) throw new JournalError(500, "Brak GEMINI_API_KEY na serwerze.");

  const question = (input.question ?? "").trim();
  if (!question) throw new JournalError(400, "Pole `question` jest wymagane.");

  const activeDate = resolveDate(input.date);

  const { data: dayRows } = await ctx.admin
    .from("entries")
    .select("mood,content_text")
    .eq("user_id", ctx.userId)
    .eq("date", activeDate)
    .order("created_at", { ascending: true });
  const contextEntries = (dayRows ?? []).map((e) => ({
    mood: e.mood as number,
    contentText: (e.content_text as string) ?? "",
  }));

  const chat = await ensureChat(ctx, input.chatId, question);

  await ctx.admin
    .from("chat_messages")
    .insert({ chat_id: chat.id, user_id: ctx.userId, role: "user", text: question });

  let reply: string;
  try {
    reply = await runAgent({
      supabase: ctx.admin,
      userId: ctx.userId,
      activeDate,
      contextEntries,
      messages: [...chat.history, { role: "user", text: question }],
    });
  } catch (err) {
    console.error("[journal.askAgent] agent error:", err);
    throw new JournalError(502, "Nie udało się uzyskać odpowiedzi od asystenta.");
  }

  await ctx.admin
    .from("chat_messages")
    .insert({ chat_id: chat.id, user_id: ctx.userId, role: "assistant", text: reply });
  await ctx.admin
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chat.id)
    .eq("user_id", ctx.userId);

  return { chatId: chat.id, reply };
}
