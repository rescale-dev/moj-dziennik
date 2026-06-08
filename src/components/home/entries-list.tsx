"use client";

import { NotebookPen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isToday, parseKey } from "@/lib/date";
import { useDayEntries, useHydrated } from "@/lib/hooks";
import { useUiStore } from "@/lib/store/ui";
import { EntryCard } from "./entry-card";

export function EntriesList() {
  const activeDate = useUiStore((s) => s.activeDate);
  const openNewEntry = useUiStore((s) => s.openNewEntry);
  const hydrated = useHydrated();
  const entries = useDayEntries(activeDate);

  const today = isToday(parseKey(activeDate));
  const title = today ? "Dzisiejsze wpisy" : "Wpisy";

  return (
    <section className="mt-6 px-4">
      <h2 className="mb-3 px-1 text-lg font-semibold">{title}</h2>

      {!hydrated ? (
        <div className="space-y-2">
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-8 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <NotebookPen className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            Brak wpisów tego dnia. Zapisz, jak się czujesz.
          </p>
          <Button onClick={openNewEntry} className="rounded-full">
            <Plus className="size-4" />
            Dodaj pierwszy wpis
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </section>
  );
}
