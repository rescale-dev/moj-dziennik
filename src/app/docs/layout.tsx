import type { Metadata } from "next";
import { DocsSidebar } from "@/components/docs/docs-sidebar";

export const metadata: Metadata = {
  title: "Dokumentacja API — Mój Dziennik",
  description: "Dokumentacja endpointów API: dodawanie wpisów, pytania do agenta, odczyt dnia.",
};

export default function DocsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl gap-10 px-6 py-10 lg:px-8">
        <aside className="sticky top-10 hidden h-[calc(100dvh-5rem)] w-60 shrink-0 overflow-y-auto md:block">
          <DocsSidebar />
        </aside>
        <main className="min-w-0 max-w-3xl flex-1 pb-20">{children}</main>
      </div>
    </div>
  );
}
