import { createClient } from "@supabase/supabase-js";
import { type AgentMessage, runAgent } from "@/lib/ai/agent";
import type { AgentEntry } from "@/lib/ai/prompt";

export const dynamic = "force-dynamic";

type Body = {
  messages: AgentMessage[];
  activeDate: string;
  openDayEntries: AgentEntry[];
};

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
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

  // Bramka płatności: Agent AI dostępny tylko po jednorazowej opłacie.
  // Sprawdzane serwerowo, by nie dało się ominąć UI wołając endpoint wprost.
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_unlocked")
    .single();
  if (!profile?.ai_unlocked) {
    return Response.json({ error: "Agent AI wymaga opłaty." }, { status: 402 });
  }

  try {
    const reply = await runAgent({
      supabase,
      activeDate: body.activeDate,
      contextEntries: body.openDayEntries ?? [],
      messages: body.messages ?? [],
    });
    return Response.json({ reply });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return Response.json(
      { error: "Nie udało się uzyskać odpowiedzi od asystenta" },
      { status: 502 },
    );
  }
}
