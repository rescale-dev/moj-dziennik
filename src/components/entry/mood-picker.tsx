"use client";

import { MOODS } from "@/lib/moods";
import type { Mood } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MoodPicker({
  value,
  onChange,
}: {
  value: Mood | null;
  onChange: (mood: Mood) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MOODS.map((mood) => {
        const selected = value === mood.value;
        return (
          <button
            key={mood.value}
            type="button"
            onClick={() => onChange(mood.value)}
            aria-label={mood.label}
            aria-pressed={selected}
            title={mood.label}
            className={cn(
              "flex aspect-square items-center justify-center rounded-2xl text-3xl transition-all",
              selected
                ? "bg-primary/10 ring-2 ring-primary"
                : "bg-muted hover:bg-muted/70",
            )}
          >
            {mood.emoji}
          </button>
        );
      })}
    </div>
  );
}
