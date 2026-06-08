"use client";

import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { dayWord } from "@/lib/date";
import { useHydrated, useStreak } from "@/lib/hooks";
import { MILESTONES } from "@/lib/streak";

function nextMilestone(current: number): number {
  return MILESTONES.find((m) => m > current) ?? MILESTONES[MILESTONES.length - 1];
}

function StreakRing({ current }: { current: number }) {
  const target = nextMilestone(current);
  const fraction = Math.min(current / target, 1);
  const size = 84;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-primary/15"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none">{current}</span>
        <span className="text-[11px] text-muted-foreground">{dayWord(current)}</span>
        <Flame className="size-3.5 text-primary" />
      </div>
    </div>
  );
}

export function StreakBanner() {
  const hydrated = useHydrated();
  const streak = useStreak();
  const current = hydrated ? streak.current : 0;
  const longest = hydrated ? streak.longest : 0;

  const active = current > 0;

  return (
    <section className="mt-5 px-4">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-lime-50 py-0 shadow-sm dark:from-emerald-950/30 dark:to-lime-950/20">
        <CardContent className="flex items-center gap-4 p-4">
          <StreakRing current={current} />
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight">
              {active ? "Tak trzymaj!" : "Zacznij swoją serię"}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {active
                ? `Dodajesz wpisy już ${current} ${dayWord(current)} z rzędu.`
                : "Dodaj dziś pierwszy wpis, aby rozpocząć serię."}
            </p>
            {longest > 0 && (
              <Badge variant="secondary" className="mt-2 font-medium">
                Najdłuższa seria: {longest} {dayWord(longest)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
