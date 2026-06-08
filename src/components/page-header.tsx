"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PageHeader({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-2 px-4 pt-6 pb-2">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="rounded-full"
        aria-label="Wróć"
      >
        <Link href="/">
          <ChevronLeft className="size-5" />
        </Link>
      </Button>
      <h1 className="text-xl font-bold">{title}</h1>
    </header>
  );
}
