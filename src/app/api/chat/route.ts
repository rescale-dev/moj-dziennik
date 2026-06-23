import { createClient } from "@supabase/supabase-js";
import { type AgentId, DEFAULT_AGENT_ID, getAgent, isPaidAgent } from "@/lib/agents";
import { type AgentMessage, runAgent } from "@/lib/ai/agent";
import type { AgentEntry } from "@/lib/ai/prompt";

export const dynamic = "force-dynamic";

type Body = {
  messages: AgentMessage[];
  activeDate: string;
  openDayEntries: AgentEntry[];
  agentId?: AgentId;
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

  const agentId = (body.agentId ?? DEFAULT_AGENT_ID) as AgentId;
  const agent = getAgent(agentId);

  // Bramka płatności: płatny agent dostępny tylko z uprawnieniem.
  // Sprawdzane serwerowo, by nie dało się ominąć UI wołając endpoint wprost.
  if (isPaidAgent(agent.id)) {
    const { data: ent } = await supabase
      .from("agent_entitlements")
      .select("agent_id")
      .eq("agent_id", agent.id)
      .maybeSingle();
    if (!ent) {
      return Response.json({ error: `Agent „${agent.name}" wymaga zakupu.` }, { status: 402 });
    }
  }

  try {
    const reply = await runAgent({
      supabase,
      agentId: agent.id,
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
