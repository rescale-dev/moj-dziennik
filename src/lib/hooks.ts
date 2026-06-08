"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { greetingForHour, warsawHour } from "./date";
import { useEntriesStore } from "./store/entries";
import { computeStreak } from "./streak";
import type { Entry, StreakState } from "./types";

const noopSubscribe = () => () => {};

/** Powitanie wg pory dnia w Polsce. Start: lokalny Intl (Europe/Warsaw),
 *  potem doprecyzowane przez /api/time. */
export function useGreeting(): string {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    fetch("/api/time")
      .then((r) => r.json())
      .then((d) => {
        if (active && typeof d?.hour === "number") setHour(d.hour);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return greetingForHour(hour ?? warsawHour());
}

/** True dopiero po zamontowaniu na kliencie — chroni przed rozjazdem hydracji
 *  przy danych z localStorage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Wpisy danego dnia, posortowane rosnąco po godzinie utworzenia. */
export function useDayEntries(dateKey: string): Entry[] {
  const entries = useEntriesStore((s) => s.entries);
  return useMemo(
    () =>
      entries
        .filter((e) => e.date === dateKey)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [entries, dateKey],
  );
}

/** Zbiór dni (klucze YYYY-MM-DD), które mają co najmniej jeden wpis. */
export function useEntryDates(): Set<string> {
  const entries = useEntriesStore((s) => s.entries);
  return useMemo(() => new Set(entries.map((e) => e.date)), [entries]);
}

export function useStreak(): StreakState {
  const entries = useEntriesStore((s) => s.entries);
  return useMemo(() => computeStreak(entries.map((e) => e.date)), [entries]);
}

export function useEntry(id: string | null): Entry | undefined {
  const entries = useEntriesStore((s) => s.entries);
  return useMemo(() => entries.find((e) => e.id === id), [entries, id]);
}
