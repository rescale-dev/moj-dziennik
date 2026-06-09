import { type Content, type FunctionCall, GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { type AgentEntry, buildSystemPrompt } from "@/lib/ai/prompt";

export const dynamic = "force-dynamic";

const MODEL = "gemini-2.5-flash";
const MAX_TOOL_TURNS = 5;

type ClientMessage = { role: "user" | "assistant"; text: string };

type Body = {
  messages: ClientMessage[];
  activeDate: string;
  openDayEntries: AgentEntry[];
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

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Brak GEMINI_API_KEY" }, { status: 500 });
  }

  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return Response.json({ error: "Brak autoryzacji" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  // Klient Supabase ograniczony tokenem użytkownika → narzędzia respektują RLS.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  type Row = { date: string; mood: number; content_text: string };
  const toResult = (rows: Row[] | null) =>
    (rows ?? []).map((r) => ({ date: r.date, mood: r.mood, text: r.content_text?.slice(0, 300) ?? "" }));

  async function runTool(name: string, args: Record<string, unknown>) {
    if (name === "get_entries_by_date") {
      const { data } = await supabase
        .from("entries")
        .select("date,mood,content_text")
        .eq("date", String(args.date))
        .order("created_at");
      return { entries: toResult(data as Row[]) };
    }
    if (name === "get_entries_in_range") {
      const { data } = await supabase
        .from("entries")
        .select("date,mood,content_text")
        .gte("date", String(args.start))
        .lte("date", String(args.end))
        .order("date");
      return { entries: toResult(data as Row[]) };
    }
    if (name === "search_entries") {
      let q = supabase.from("entries").select("date,mood,content_text");
      if (args.query) q = q.ilike("content_text", `%${String(args.query)}%`);
      if (typeof args.mood === "number") q = q.eq("mood", args.mood);
      const { data } = await q.order("date", { ascending: false }).limit(50);
      return { entries: toResult(data as Row[]) };
    }
    return { error: "Nieznane narzędzie" };
  }

  const ai = new GoogleGenAI({ apiKey });

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

  const systemInstruction = buildSystemPrompt(body.activeDate, body.openDayEntries ?? []);
  const contents: Content[] = (body.messages ?? []).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.text }],
  }));

  try {
    for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
      const response = await generate(contents);

      const calls: FunctionCall[] = response.functionCalls ?? [];
      if (calls.length === 0) {
        return Response.json({ reply: response.text ?? "" });
      }

      // Dołącz turę modelu (z wywołaniami) i odpowiedzi narzędzi.
      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) contents.push(modelContent);

      const parts = [];
      for (const call of calls) {
        const result = await runTool(call.name ?? "", call.args ?? {});
        parts.push({
          functionResponse: { name: call.name, id: call.id, response: result },
        });
      }
      contents.push({ role: "user", parts });
    }

    return Response.json({
      reply: "Hmm, pogubiłem się przy zaglądaniu do wpisów. Spróbuj zapytać jeszcze raz?",
    });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return Response.json(
      { error: "Nie udało się uzyskać odpowiedzi od asystenta" },
      { status: 502 },
    );
  }
}
