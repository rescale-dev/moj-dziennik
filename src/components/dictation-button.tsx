"use client";

import { Mic } from "lucide-react";
import { useDictation } from "@/lib/use-dictation";
import { cn } from "@/lib/utils";

/**
 * Przycisk dyktowania (mikrofon). Wkleja rozpoznany tekst przez `onText`.
 * Nie renderuje się, gdy przeglądarka nie wspiera Web Speech API.
 */
export function DictationButton({
  onText,
  className,
  title = "Dyktuj głosem",
}: {
  onText: (text: string) => void;
  className?: string;
  title?: string;
}) {
  const { supported, listening, toggle } = useDictation(onText);
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={title}
      aria-pressed={listening}
      title={title}
      className={cn(
        "relative inline-flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        listening && "text-red-500 hover:text-red-500",
        className,
      )}
    >
      <Mic className="size-4" />
      {listening && (
        <span className="absolute -top-0.5 -right-0.5 size-2 animate-pulse rounded-full bg-red-500" />
      )}
    </button>
  );
}
