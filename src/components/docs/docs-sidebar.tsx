"use client";

import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    label: "Wprowadzenie",
    items: [{ href: "/docs", label: "Przegląd i autoryzacja" }],
  },
  {
    label: "API",
    items: [
      { href: "/docs/create", label: "Create — dodaj wpis" },
      { href: "/docs/ask", label: "Ask — zapytaj agenta" },
      { href: "/docs/read", label: "Read — odczytaj dzień" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      <Link href="/docs" className="flex items-center gap-2 font-semibold">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <BookOpen className="size-4" />
        </span>
        Dokumentacja API
      </Link>

      {NAV.map((group) => (
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
