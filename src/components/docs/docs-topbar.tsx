"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeTab, DOC_TABS } from "@/components/docs/nav";
import { TokenGenerator } from "@/components/docs/token-generator";
import { cn } from "@/lib/utils";

/** Wspólny pasek docs: brand + przełącznik zakładek (API/MCP) + generator tokenu. */
export function DocsTopbar() {
  const pathname = usePathname();
  const tab = activeTab(pathname);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6 lg:px-8">
        <Link href="/docs" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <BookOpen className="size-4" />
          </span>
          <span className="hidden sm:inline">Mój Dziennik — Docs</span>
        </Link>

        <nav className="flex items-center gap-1">
          {DOC_TABS.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto">
          <TokenGenerator />
        </div>
      </div>
    </header>
  );
}
