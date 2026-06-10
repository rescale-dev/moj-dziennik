"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeTab, DOC_TABS } from "@/components/docs/nav";
import { cn } from "@/lib/utils";

/** Boczna nawigacja zależna od aktywnej zakładki (API / MCP). */
export function DocsSidebar() {
  const pathname = usePathname();
  const tab = activeTab(pathname);
  const groups = DOC_TABS.find((t) => t.key === tab)?.groups ?? [];

  return (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-1.5 px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Wróć do aplikacji
      </Link>
    </nav>
  );
}
