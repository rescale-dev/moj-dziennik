"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { MessageSquarePlus, MessagesSquare } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useChatStore } from "@/lib/store/chat";

export function ChatHistorySheet({
  open,
  onOpenChange,
  onOpenChat,
  onNewChat,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenChat: (id: string) => void;
  onNewChat: () => void;
}) {
  const chats = useChatStore((s) => s.chats);
  const sorted = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [chats],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto h-[70vh] max-w-md rounded-t-3xl p-0"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessagesSquare className="size-5" />
            Historia czatów
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4">
          <Button onClick={onNewChat} className="w-full rounded-full">
            <MessageSquarePlus className="size-4" />
            Nowy czat
          </Button>

          {sorted.map((chat) => {
            const last = chat.messages[chat.messages.length - 1];
            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => onOpenChat(chat.id)}
                className="w-full rounded-2xl bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{chat.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(chat.updatedAt), "d MMM", { locale: pl })}
                  </span>
                </div>
                {last && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {last.text}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3" />
      </SheetContent>
    </Sheet>
  );
}
