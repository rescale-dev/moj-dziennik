"use client";

import { Bell, CalendarDays, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ProfileSheet } from "@/components/profile/profile-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useGreeting } from "@/lib/hooks";
import { useUserStore } from "@/lib/store/user";

export function HomeHeader() {
  const user = useUserStore((s) => s.user);
  const greeting = useGreeting();
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = user.name.trim().slice(0, 2).toUpperCase();

  return (
    <header className="px-5 pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg text-muted-foreground" suppressHydrationWarning>
            {greeting}
          </p>
          <h1 className="truncate text-4xl font-bold tracking-tight">{user.name}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Dokumentacja API"
          >
            <Link href="/docs">
              <FileText className="size-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Powiadomienia"
            onClick={() => toast("Powiadomienia — wkrótce")}
          >
            <Bell className="size-5" />
          </Button>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label="Otwórz profil"
            className="rounded-full transition-transform hover:scale-105 active:scale-95"
          >
            <Avatar className="size-16">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/calendar" aria-label="Otwórz kalendarz">
            <CalendarDays className="size-4" />
            Kalendarz
          </Link>
        </Button>
      </div>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}
