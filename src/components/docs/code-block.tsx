"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Blok kodu z przyciskiem kopiowania (styl jak w docs Vercela). */
export function CodeBlock({
  code,
  language,
  className,
}: {
  code: string;
  language?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignorujemy — brak schowka */
    }
  };

  return (
    <div className={cn("group relative my-4 overflow-hidden rounded-lg border bg-muted/40", className)}>
      {language && (
        <div className="flex items-center justify-between border-b bg-muted/60 px-3 py-1.5">
          <span className="font-mono text-xs text-muted-foreground">{language}</span>
        </div>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label="Kopiuj"
        className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md border bg-background/80 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      >
        {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}
