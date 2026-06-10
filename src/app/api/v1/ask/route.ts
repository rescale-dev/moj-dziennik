import { NextRequest } from "next/server";
import { type AgentMessage, runAgent } from "@/lib/ai/agent";
import { warsawDateKey } from "@/lib/date";
import { type AuthContext, resolveToken, unauthorized } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type AskBody = { question?: string; date?: string; chatId?: string };

/** Zapewnia czat: istniejący (z weryfikacją właściciela) albo nowy. Zwraca id + historię. */
async function ensureChat(
  auth: AuthContext,
  chatId: string | undefined,
  question: string,
): Promise<{ id: string; history: AgentMessage[] } | null> {
  if (chatId) {
    const { data: chat } = await auth.admin
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (!chat) return null; // nie istnieje lub nie należy do użytkownika

    const { data: msgs } = await auth.admin
      .from("chat_messages")
      .select("role,text")
      .eq("chat_id", chatId)
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: true });

    const history = (msgs ?? []).map((m) => ({
      role: m.role as AgentMessage["role"],
      text: m.text as string,
    }));
    return { id: chatId, history };
  }

  const title = question.slice(0, 60);
  const { data: created, error } = await auth.admin
    .from("chats")
    .insert({ user_id: auth.userId, title })
    .select("id")
    .single();
  if (error || !created) return null;
  return { id: created.id as string, history: [] };
}

/** POST /api/v1/ask — pytanie do agenta (kontekst dnia, historia, zapis do chats). */
export async function POST(req: NextRequest) {
  const auth = await resolveToken(req);
  if (!auth) return unauthorized();

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Brak GEMINI_API_KEY na serwerze." }, { status: 500 });
  }

  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const question = (body.question ?? "").trim();
  if (!question) {
    return Response.json({ error: "Pole `question` jest wymagane." }, { status: 400 });
  }

  const activeDate = body.date ?? warsawDateKey();
  if (!DATE_RE.test(activeDate)) {
    return Response.json({ error: "`date` musi mieć format YYYY-MM-DD." }, { status: 400 });
  }

  // Kontekst: wpisy z wybranego dnia (jak „otwarty dzień" w UI).
  const { data: dayRows } = await auth.admin
    .from("entries")
    .select("mood,content_text")
    .eq("user_id", auth.userId)
    .eq("date", activeDate)
    .order("created_at", { ascending: true });
  const contextEntries = (dayRows ?? []).map((e) => ({
    mood: e.mood as number,
    contentText: (e.content_text as string) ?? "",
  }));

  const chat = await ensureChat(auth, body.chatId, question);
  if (!chat) {
    return Response.json({ error: "Czat nie istnieje lub brak dostępu." }, { status: 404 });
  }

  // Zapis pytania użytkownika.
  await auth.admin
    .from("chat_messages")
    .insert({ chat_id: chat.id, user_id: auth.userId, role: "user", text: question });

  let reply: string;
  try {
    reply = await runAgent({
      supabase: auth.admin,
      userId: auth.userId,
      activeDate,
      contextEntries,
      messages: [...chat.history, { role: "user", text: question }],
    });
  } catch (err) {
    console.error("[POST /api/v1/ask] agent error:", err);
    return Response.json(
      { error: "Nie udało się uzyskać odpowiedzi od asystenta." },
      { status: 502 },
    );
  }

  // Zapis odpowiedzi + odświeżenie czatu (sortowanie po updated_at).
  await auth.admin
    .from("chat_messages")
    .insert({ chat_id: chat.id, user_id: auth.userId, role: "assistant", text: reply });
  await auth.admin
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chat.id)
    .eq("user_id", auth.userId);

  return Response.json({ chatId: chat.id, reply });
}
