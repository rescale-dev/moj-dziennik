"use client";

import { Flame, NotebookPen, Smile, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useHydrated } from "@/lib/hooks";
import { useEntriesStore } from "@/lib/store/entries";
import { moodCounts, moodTrend, type RangeDays, statsSummary } from "@/lib/stats";
import { cn } from "@/lib/utils";

const RANGES: RangeDays[] = [7, 30, 90];

/** Kolory nastrojów 1–5 (od smutku do radości) dla wykresu rozkładu. */
const MOOD_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981"];

const trendConfig = {
  mood: { label: "Średni nastrój", color: "var(--primary)" },
} satisfies ChartConfig;

const countConfig = {
  count: { label: "Wpisy" },
} satisfies ChartConfig;

export default function StatsPage() {
  const hydrated = useHydrated();
  const entries = useEntriesStore((s) => s.entries);
  const [range, setRange] = useState<RangeDays>(7);

  if (!hydrated) {
    return (
      <div>
        <PageHeader title="Statystyki" />
        <div className="space-y-3 px-4">
          <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          <div className="h-56 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  const summary = statsSummary(entries, range);
  const trend = moodTrend(entries, range);
  const counts = moodCounts(entries, range);
  const hasAny = entries.length > 0;

  return (
    <div className="pb-4">
      <PageHeader title="Statystyki" />
      <div className="space-y-4 px-4">
        {/* Wybór zakresu */}
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-sm font-medium transition-colors",
                range === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {r} dni
            </button>
          ))}
        </div>

        {!hasAny && (
          <p className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground">
            Dodaj pierwszy wpis, aby zobaczyć statystyki.
          </p>
        )}

        {/* Karty podsumowania */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={<Smile className="size-4" />}
            label="Średni nastrój"
            value={summary.avg ? `${summary.avg}` : "—"}
            suffix={summary.avgEmoji ?? ""}
          />
          <SummaryCard
            icon={<NotebookPen className="size-4" />}
            label={`Wpisy (${range} dni)`}
            value={`${summary.totalEntries}`}
          />
          <SummaryCard
            icon={<Flame className="size-4" />}
            label="Najdłuższa seria"
            value={`${summary.longest}`}
            suffix="dni"
          />
          <SummaryCard
            icon={<Sparkles className="size-4" />}
            label={`Dni zadowolenia ${summary.year}`}
            value={`${summary.happyDays}`}
            suffix="dni"
          />
        </div>

        {/* Trend nastroju */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trend nastroju</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendConfig} className="h-48 w-full">
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="fillMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-mood)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-mood)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="mood"
                  type="monotone"
                  stroke="var(--color-mood)"
                  strokeWidth={2}
                  fill="url(#fillMood)"
                  connectNulls
                  dot={range === 7}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Rozkład nastrojów */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rozkład nastrojów</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={countConfig} className="h-44 w-full">
              <BarChart data={counts} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="emoji" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="label" labelKey="label" />}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {counts.map((c, i) => (
                    <Cell key={c.mood} fill={MOOD_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {value}
        {suffix ? <span className="ml-1 text-base font-medium">{suffix}</span> : null}
      </p>
    </div>
  );
}
