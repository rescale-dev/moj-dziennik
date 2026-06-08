import { differenceInCalendarDays, parseISO } from "date-fns";
import type { StreakState } from "./types";

export const MILESTONES = [7, 14, 30, 90, 365] as const;
export type Milestone = (typeof MILESTONES)[number];

/**
 * Liczy serię z pełnej historii dni z wpisami (czysta funkcja).
 * - `current`: nieprzerwany ciąg kończący się dziś lub wczoraj (łaska do końca dnia).
 * - `longest`: najdłuższy ciąg w całej historii.
 * Wpis wstecz uzupełniający lukę odbudowuje serię (wariant miękki, zgodny z PRD).
 */
export function computeStreak(dateKeys: string[], today = new Date()): StreakState {
  const unique = Array.from(new Set(dateKeys)).sort();
  if (unique.length === 0) return { current: 0, longest: 0 };

  const days = unique.map((k) => parseISO(k));

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = differenceInCalendarDays(days[i], days[i - 1]);
    if (diff === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
  }

  const last = days[days.length - 1];
  const gapToToday = differenceInCalendarDays(today, last);
  let current = 0;
  if (gapToToday <= 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      if (differenceInCalendarDays(days[i], days[i - 1]) === 1) current += 1;
      else break;
    }
  }

  return { current, longest, lastEntryDate: unique[unique.length - 1] };
}

/** Zwraca osiągnięty kamień milowy, jeśli `current` jest dokładnie jednym z progów. */
export function reachedMilestone(current: number): Milestone | null {
  return (MILESTONES as readonly number[]).includes(current)
    ? (current as Milestone)
    : null;
}
