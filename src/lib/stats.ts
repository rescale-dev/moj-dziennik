import { eachDayOfInterval, format, subDays } from "date-fns";
import { pl } from "date-fns/locale";
import { dateKey } from "./date";
import { getMood, MOODS } from "./moods";
import { computeStreak } from "./streak";
import type { Entry, Mood } from "./types";

export type RangeDays = 7 | 30 | 90;

export type MoodPoint = { key: string; label: string; mood: number | null };

/** Średni nastrój dla każdego dnia w zakresie (null = brak wpisów). */
export function moodTrend(entries: Entry[], days: RangeDays, today = new Date()): MoodPoint[] {
  const start = subDays(today, days - 1);
  return eachDayOfInterval({ start, end: today }).map((d) => {
    const key = dateKey(d);
    const dayEntries = entries.filter((e) => e.date === key);
    const mood = dayEntries.length
      ? Number((dayEntries.reduce((s, e) => s + e.mood, 0) / dayEntries.length).toFixed(2))
      : null;
    const label = format(d, days <= 7 ? "EEEEEE" : "d MMM", { locale: pl });
    return { key, label, mood };
  });
}

export type MoodCount = { mood: Mood; label: string; emoji: string; count: number };

/** Liczba wpisów dla każdego nastroju (w zakresie dni). */
export function moodCounts(entries: Entry[], days: RangeDays, today = new Date()): MoodCount[] {
  const start = dateKey(subDays(today, days - 1));
  const inRange = entries.filter((e) => e.date >= start);
  return MOODS.map((m) => ({
    mood: m.value,
    label: m.label,
    emoji: m.emoji,
    count: inRange.filter((e) => e.mood === m.value).length,
  }));
}

export type StatsSummary = {
  totalEntries: number;
  avg: number | null;
  avgEmoji: string | null;
  happyDays: number;
  longest: number;
  year: number;
};

/** Podsumowanie: liczba wpisów i średnia w zakresie, dni zadowolenia w roku,
 *  najdłuższa seria z całej historii. */
export function statsSummary(
  entries: Entry[],
  days: RangeDays,
  today = new Date(),
): StatsSummary {
  const start = dateKey(subDays(today, days - 1));
  const inRange = entries.filter((e) => e.date >= start);
  const avg = inRange.length
    ? Number((inRange.reduce((s, e) => s + e.mood, 0) / inRange.length).toFixed(1))
    : null;

  const year = today.getFullYear();
  const yearStart = `${year}-01-01`;
  const byDay = new Map<string, number[]>();
  for (const e of entries) {
    if (e.date < yearStart) continue;
    const arr = byDay.get(e.date);
    if (arr) arr.push(e.mood);
    else byDay.set(e.date, [e.mood]);
  }
  let happyDays = 0;
  for (const moods of byDay.values()) {
    if (moods.reduce((s, m) => s + m, 0) / moods.length >= 4) happyDays += 1;
  }

  const longest = computeStreak(entries.map((e) => e.date), today).longest;

  return {
    totalEntries: inRange.length,
    avg,
    avgEmoji: avg ? getMood(Math.round(avg) as Mood).emoji : null,
    happyDays,
    longest,
    year,
  };
}
