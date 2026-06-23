/**
 * Rejestr agentów AI. Źródło prawdy o tym, jacy agenci istnieją, który jest
 * darmowy, a który płatny. Bez sekretów — importowalny z klienta i serwera.
 */

export type AgentId = "friend" | "musk";

export type AgentDef = {
  id: AgentId;
  /** Nazwa wyświetlana. */
  name: string;
  /** Jednolinijkowy hak. */
  tagline: string;
  /** Dłuższy opis w sklepie / popupie. */
  description: string;
  /** Czy darmowy (zawsze dostępny, bez zakupu). */
  free: boolean;
  /** Etykieta ceny, gdy płatny. */
  priceLabel?: string;
  /** Klasy gradientu ikony (Tailwind). */
  accent: string;
};

export const AGENTS: AgentDef[] = [
  {
    id: "friend",
    name: "Asystent AI",
    tagline: "Ciepły, empatyczny przyjaciel",
    description:
      "Twój dziennikowy przyjaciel — wysłucha, wesprze i delikatnie dopyta o samopoczucie. Zawsze po Twojej stronie.",
    free: true,
    accent: "from-indigo-500 to-fuchsia-500",
  },
  {
    id: "musk",
    name: "Musk AI",
    tagline: "Surowy doradca od pierwszych zasad",
    description:
      "Zero pocieszania. Myśli od pierwszych zasad, nazywa problem po imieniu i kończy konkretnym ruchem na dziś. Dla tych, którzy chcą kopniaka, nie głaskania.",
    free: false,
    priceLabel: "5 zł",
    accent: "from-zinc-700 to-zinc-900",
  },
];

export const DEFAULT_AGENT_ID: AgentId = "friend";

export function getAgent(id: string | null | undefined): AgentDef {
  return AGENTS.find((a) => a.id === id) ?? AGENTS[0];
}

export function isPaidAgent(id: string | null | undefined): boolean {
  const a = AGENTS.find((x) => x.id === id);
  return !!a && !a.free;
}
