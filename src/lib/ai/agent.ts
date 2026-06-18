import { type Content, type FunctionCall, GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embed";
import { type AgentEntry, buildSystemPrompt } from "./prompt";

const MODEL = "gemini-2.5-flash";
const MAX_TOOL_TURNS = 5;

export type AgentMessage = { role: "user" | "assistant"; text: string };

export type RunAgentOptions = {
  /** Klient Supabase z dostępem do wpisów użytkownika. */
  supabase: SupabaseClient;
  /**
   * UID użytkownika. Gdy podany, narzędzia filtrują po `user_id` (konieczne,
   * gdy klient używa service key i nie ma RLS). Pomiń, gdy klient jest już
   * ograniczony tokenem użytkownika (RLS sam izoluje dane).
   */
  userId?: string;
  /** Dzień będący kontekstem rozmowy (YYYY-MM-DD). */
  activeDate: string;
  /** Wpisy z otwartego dnia, wstrzykiwane do promptu systemowego. */
  contextEntries: AgentEntry[];
  /** Historia rozmowy (łącznie z bieżącym pytaniem na końcu). */
  messages: AgentMessage[];
};

const functionDeclarations = [
  {
    name: "get_entries_by_date",
    description: "Pobiera wpisy dziennika użytkownika z konkretnego dnia.",
    parametersJsonSchema: {
      type: "object",
      properties: { date: { type: "string", description: "Dzień w formacie YYYY-MM-DD" } },
      required: ["date"],
    },
  },
  {
    name: "get_entries_in_range",
    description: "Pobiera wpisy z zakresu dat (włącznie), np. ostatni tydzień.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        start: { type: "string", description: "Data początkowa YYYY-MM-DD" },
        end: { type: "string", description: "Data końcowa YYYY-MM-DD" },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "search_entries",
    description:
      "Wyszukuje wpisy po fragmencie treści i/lub nastroju (1–5). Użyj do pytań typu „kiedy czułem się dobrze”.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Fraza do wyszukania w treści wpisu (opcjonalna)" },
        mood: { type: "number", description: "Filtr nastroju 1–5 (opcjonalny)" },
      },
    },
  },
];

type Row = { date: string; mood: number; content_text: string; id?: string };

const toResult = (rows: Row[] | null) =>
  (rows ?? []).map((r) => ({ date: r.date, mood: r.mood, text: r.content_text?.slice(0, 300) ?? "" }));

/**
 * Uruchamia agenta-„przyjaciela" (Gemini) z narzędziami sięgającymi po wpisy
 * dziennika. Zwraca finalną odpowiedź tekstową. Współdzielone przez czat w UI
 * (/api/chat, RLS) i publiczne API (/api/v1/ask, service key + userId).
 */
export async function runAgent(opts: RunAgentOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Brak GEMINI_API_KEY");

  const { supabase, userId, activeDate, contextEntries, messages } = opts;

  // Pre-search: hybrydowe wyszukiwanie na ostatnim pytaniu użytkownika przed wywołaniem modelu.
  const lastUserText = messages.at(-1)?.text ?? "";
  let retrievedEntries: AgentEntry[] = [];
  if (lastUserText) {
    const queryEmbedding = await generateEmbedding(lastUserText);
    // Pre-fetch używa wyłącznie arm wektorowego (p_query = '') — pełne pytanie nie pasuje
    // do ILIKE; arm tekstowy zostawiamy dla narzędzia search_entries z konkretnymi słowami.
    const { data: hits, error: preErr } = await supabase.rpc("match_entries_hybrid", {
      p_user_id:     userId ?? null,
      p_embedding:   queryEmbedding,
      p_query:       "",
      p_mood:        null,
      p_match_count: 15,
    });
    if (preErr) console.error("[agent.preFetch] match_entries_hybrid error:", preErr.message);
    if (hits) {
      retrievedEntries = (hits as Array<{ date: string; mood: number; content_text: string }>).map(
        (h) => ({ date: h.date, mood: h.mood, contentText: h.content_text?.slice(0, 400) ?? "" }),
      );
    }
  }

  const scoped = <T>(q: T): T =>
    // Filtr po user_id tylko gdy mamy userId (service key bez RLS).
    userId ? ((q as { eq: (c: string, v: string) => T }).eq("user_id", userId) as T) : q;

  async function runTool(name: string, args: Record<string, unknown>) {
    if (name === "get_entries_by_date") {
      const { data } = await scoped(
        supabase.from("entries").select("date,mood,content_text").eq("date", String(args.date)),
      ).order("created_at");
      return { entries: toResult(data as Row[]) };
    }
    if (name === "get_entries_in_range") {
      const { data } = await scoped(
        supabase
          .from("entries")
          .select("date,mood,content_text")
          .gte("date", String(args.start))
          .lte("date", String(args.end)),
      ).order("date");
      return { entries: toResult(data as Row[]) };
    }
    if (name === "search_entries") {
      const queryText = args.query ? String(args.query) : "";
      const moodFilter = typeof args.mood === "number" ? args.mood : null;

      const embedding = queryText ? await generateEmbedding(queryText) : null;

      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "match_entries_hybrid",
        {
          p_user_id:     userId ?? null,
          p_embedding:   embedding,
          p_query:       queryText,
          p_mood:        moodFilter,
          p_match_count: 30,
        },
      );

      if (!rpcError) {
        return { entries: toResult(rpcData as Row[]) };
      }

      console.warn("[search_entries] RPC failed, falling back to ilike:", rpcError.message);
      let q = scoped(supabase.from("entries").select("date,mood,content_text"));
      if (queryText) q = q.ilike("content_text", `%${queryText}%`);
      if (moodFilter !== null) q = q.eq("mood", moodFilter);
      const { data } = await q.order("date", { ascending: false }).limit(50);
      return { entries: toResult(data as Row[]) };
    }
    return { error: "Nieznane narzędzie" };
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = buildSystemPrompt(activeDate, contextEntries ?? [], retrievedEntries);

  // Retry przy przejściowych błędach Gemini (503 przeciążenie / 429 limit / 500).
  async function generate(contents: Content[]) {
    const maxAttempts = 4;
    for (let attempt = 1; ; attempt++) {
      try {
        return await ai.models.generateContent({
          model: MODEL,
          contents,
          config: { systemInstruction, tools: [{ functionDeclarations }] },
        });
      } catch (e) {
        const status = (e as { status?: number })?.status;
        const transient = status === 503 || status === 429 || status === 500;
        if (!transient || attempt >= maxAttempts) throw e;
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }

  const contents: Content[] = (messages ?? []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await generate(contents);
    const calls: FunctionCall[] = response.functionCalls ?? [];
    if (calls.length === 0) {
      return response.text ?? "";
    }

    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const parts = [];
    for (const call of calls) {
      const result = await runTool(call.name ?? "", call.args ?? {});
      parts.push({ functionResponse: { name: call.name, id: call.id, response: result } });
    }
    contents.push({ role: "user", parts });
  }

  return "Hmm, pogubiłem się przy zaglądaniu do wpisów. Spróbuj zapytać jeszcze raz?";
}
