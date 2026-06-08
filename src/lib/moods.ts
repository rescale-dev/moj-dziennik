import type { Mood } from "./types";

export type MoodDef = {
  value: Mood;
  emoji: string;
  label: string;
  /** Klasa tła używana, gdy nastrój jest zaznaczony / na kafelku. */
  ringClass: string;
};

/** Jedno źródło prawdy dla nastrojów (skala 1–5). */
export const MOODS: MoodDef[] = [
  { value: 1, emoji: "😢", label: "Bardzo źle", ringClass: "bg-red-100 dark:bg-red-950/40" },
  { value: 2, emoji: "😔", label: "Źle", ringClass: "bg-orange-100 dark:bg-orange-950/40" },
  { value: 3, emoji: "😐", label: "Neutralnie", ringClass: "bg-yellow-100 dark:bg-yellow-950/40" },
  { value: 4, emoji: "🙂", label: "Dobrze", ringClass: "bg-lime-100 dark:bg-lime-950/40" },
  { value: 5, emoji: "🤩", label: "Super ekstra", ringClass: "bg-emerald-100 dark:bg-emerald-950/40" },
];

export function getMood(value: Mood): MoodDef {
  return MOODS.find((m) => m.value === value) ?? MOODS[2];
}
