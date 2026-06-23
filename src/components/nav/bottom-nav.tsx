"use client";

import { BarChart3, Home, MessagesSquare, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AiChatSheet } from "@/components/chat/ai-chat-sheet";
import { ChatHistorySheet } from "@/components/chat/chat-history-sheet";
import { PaywallDialog } from "@/components/chat/paywall-dialog";
import { useChatStore } from "@/lib/store/chat";
import { useUiStore } from "@/lib/store/ui";
import { useUserStore } from "@/lib/store/user";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const openNewEntry = useUiStore((s) => s.openNewEntry);
  const createChat = useChatStore((s) => s.createChat);
  const aiUnlocked = useUserStore((s) => s.user.aiUnlocked);

  const [aiOpen, setAiOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const startNewChat = async () => {
    if (!aiUnlocked) {
      setHistoryOpen(false);
      setPaywallOpen(true);
      return;
    }
    try {
      const id = await createChat();
      setActiveChatId(id);
      setHistoryOpen(false);
      setAiOpen(true);
    } catch {
      toast.error("Nie udało się utworzyć czatu");
    }
  };

  const openChat = (id: string) => {
    if (!aiUnlocked) {
      setHistoryOpen(false);
      setPaywallOpen(true);
      return;
    }
    setActiveChatId(id);
    setHistoryOpen(false);
    setAiOpen(true);
  };

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-4">
        <div className="relative flex items-center justify-center">
          {/* FAB AI (lewy róg) — otwiera czat */}
          <button
            type="button"
            onClick={startNewChat}
            aria-label="Asystent AI"
            className="group absolute left-0 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <Sparkles className="size-5 transition-transform group-hover:rotate-12" />
          </button>

          {/* Pasek: Historia czatów · Home · Statystyki */}
          <div className="flex items-center gap-1 rounded-full border bg-card/90 px-3 py-2 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Historia czatów"
              className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            >
              <MessagesSquare className="size-5" />
            </button>
            <Link
              href="/"
              aria-label="Główna"
              aria-current={pathname === "/" ? "page" : undefined}
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-colors",
                pathname === "/"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Home className="size-5" />
            </Link>
            <Link
              href="/stats"
              aria-label="Statystyki"
              aria-current={pathname === "/stats" ? "page" : undefined}
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-colors",
                pathname === "/stats"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <BarChart3 className="size-5" />
            </Link>
          </div>

          {/* FAB „+" (prawy róg) — dodaje wpis */}
          <button
            type="button"
            onClick={openNewEntry}
            aria-label="Dodaj wpis"
            className="absolute right-0 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="size-6" />
          </button>
        </div>
      </nav>

      <AiChatSheet open={aiOpen} onOpenChange={setAiOpen} chatId={activeChatId} />
      <ChatHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onOpenChat={openChat}
        onNewChat={startNewChat}
      />
      <PaywallDialog open={paywallOpen} onOpenChange={setPaywallOpen} />
    </>
  );
}
