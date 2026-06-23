import { supabase } from "./client";

/** Zwraca id agentów, do których zalogowany użytkownik ma uprawnienie (RLS: tylko swoje). */
export async function fetchOwnedAgentIds(): Promise<string[]> {
  const { data, error } = await supabase.from("agent_entitlements").select("agent_id");
  if (error) throw error;
  return (data ?? []).map((r) => r.agent_id as string);
}
