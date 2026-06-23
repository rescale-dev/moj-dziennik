import type { AgentId } from "./agents";

/** Konfiguracja płatności za płatnych agentów (Stripe Payment Links). */

/** Link Stripe per agent. Można nadpisać przez env. */
const STRIPE_LINKS: Partial<Record<AgentId, string>> = {
  musk:
    process.env.NEXT_PUBLIC_STRIPE_LINK_MUSK ??
    "https://buy.stripe.com/test_4gM4gAc0F7jrcdm62L1VK00",
};

const SEP = "__";

/** Buduje client_reference_id przekazywany Stripe: `<userId>__<agentId>`. */
export function buildClientReferenceId(userId: string, agentId: AgentId): string {
  return `${userId}${SEP}${agentId}`;
}

/** Parsuje client_reference_id z webhooka Stripe na { userId, agentId }. */
export function parseClientReferenceId(
  ref: string | null | undefined,
): { userId: string; agentId: string } | null {
  if (!ref || !ref.includes(SEP)) return null;
  const [userId, agentId] = ref.split(SEP);
  if (!userId || !agentId) return null;
  return { userId, agentId };
}

/**
 * Zwraca link Stripe dla agenta z doklejonym `client_reference_id`,
 * dzięki czemu webhook wie, kto i co kupił.
 */
export function stripeCheckoutUrl(userId: string, agentId: AgentId): string | null {
  const base = STRIPE_LINKS[agentId];
  if (!base) return null;
  const url = new URL(base);
  if (userId) url.searchParams.set("client_reference_id", buildClientReferenceId(userId, agentId));
  return url.toString();
}
