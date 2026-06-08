"use client";

import { format } from "date-fns";
import { Check, Flame } from "lucide-react";
import { dateKey, isToday, parseKey, WEEKDAY_SHORT, weekDays } from "@/lib/date";
import { useEntryDates, useHydrated } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/lib/store/ui";

const EMPTY = new Set<string>();

export function WeekStrip() {
  const activeDate = useUiStore((s) => s.activeDate);
  const setActiveDate = useUiStore((s) => s.setActiveDate);
  const hydrated = useHydrated();
  const allDates = useEntryDates();
  const dates = hydrated ? allDates : EMPTY;

  const days = weekDays(parseKey(activeDate));

  return (
    <section className="mt-4 px-4">
      <div className="mb-1 px-1">
        <span className="text-xs font-medium text-muted-foreground">Ten tydzień</span>
      </div>

      <div className="flex justify-between gap-1">
        {days.map((d, i) => {
          const key = dateKey(d);
          const selected = key === activeDate;
          const has = dates.has(key);
          const today = isToday(d);

          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveDate(key)}
              className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-1.5"
              aria-label={`${WEEKDAY_SHORT[i]} ${format(d, "d")}`}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  "text-xs",
                  selected ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {WEEKDAY_SHORT[i]}
              </span>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-2xl text-sm font-semibold transition-colors",
                  has
                    ? "bg-primary/15 text-primary"
                    : today
                      ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                      : "bg-muted text-muted-foreground",
                  selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                {has ? (
                  <Check className="size-5" />
                ) : today ? (
                  <Flame className="size-5" />
                ) : (
                  format(d, "d")
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
