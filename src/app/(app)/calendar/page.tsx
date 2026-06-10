"use client";

import { pl } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Calendar } from "@/components/ui/calendar";
import { dateKey, parseKey } from "@/lib/date";
import { useEntryDates, useHydrated } from "@/lib/hooks";
import { useUiStore } from "@/lib/store/ui";

export default function CalendarPage() {
  const router = useRouter();
  const activeDate = useUiStore((s) => s.activeDate);
  const setActiveDate = useUiStore((s) => s.setActiveDate);
  const hydrated = useHydrated();
  const dates = useEntryDates();

  const entryDays = [...dates].map(parseKey);
  const selected = parseKey(activeDate);

  return (
    <div className="pb-4">
      <PageHeader title="Kalendarz" />
      <div className="px-4">
        {!hydrated ? (
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        ) : (
        <Calendar
          mode="single"
          required
          selected={selected}
          onSelect={(d) => {
            if (d) {
              setActiveDate(dateKey(d));
              router.push("/");
            }
          }}
          locale={pl}
          showOutsideDays
          modifiers={{ hasEntry: entryDays }}
          modifiersClassNames={{
            hasEntry:
              "relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
          }}
          className="w-full rounded-2xl border bg-card p-3 [--cell-size:--spacing(9)]"
          classNames={{ root: "w-full" }}
        />
        )}
        <p className="mt-4 flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          Dzień z co najmniej jednym wpisem
        </p>
      </div>
    </div>
  );
}
