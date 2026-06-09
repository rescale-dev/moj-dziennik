"use client";

import { Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useChatStore } from "@/lib/store/chat";
import { cn } from "@/lib/utils";

const CANNED_REPLY =
  "To wersja demonstracyjna asystenta — prawdziwy czat z AI pojawi się wkrótce. 🙂";

export function AiChatSheet({
  open,
  onOpenChange,
  chatId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string | null;
}) {
  const chats = useChatStore((s) => s.chats);
  const addMessage = useChatStore((s) => s.addMessage);
  const chat = useMemo(() => chats.find((c) => c.id === chatId), [chats, chatId]);
  const [input, setInput] = useState("");

  const send = async () => {
    const text = input.trim();
    if (!text || !chatId) return;
    setInput("");
    try {
      await addMessage(chatId, "user", text);
      await addMessage(chatId, "assistant", CANNED_REPLY);
    } catch {
      toast.error("Nie udało się wysłać wiadomości");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto h-[70vh] max-w-md rounded-t-3xl p-0"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
              <Sparkles className="size-4" />
            </span>
            Asystent AI
          </SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
          {!chat || chat.messages.length === 0 ? (
            <Bubble role="assistant">
              Cześć! Jestem Twoim asystentem dziennika. Zadaj pytanie o swój nastrój
              lub poproś o pomysł na wpis. (wersja demonstracyjna)
            </Bubble>
          ) : (
            chat.messages.map((m) => (
              <Bubble key={m.id} role={m.role}>
                {m.text}
              </Bubble>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 border-t p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Napisz wiadomość…"
            className="rounded-full"
          />
          <Button
            size="icon"
            className="shrink-0 rounded-full"
            aria-label="Wyślij"
            onClick={send}
            disabled={!input.trim()}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
        role === "user"
          ? "self-end bg-primary text-primary-foreground"
          : "self-start bg-muted",
      )}
    >
      {children}
    </div>
  );
}
