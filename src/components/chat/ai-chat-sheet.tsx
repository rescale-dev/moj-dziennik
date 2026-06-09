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
import { useDayEntries } from "@/lib/hooks";
import { useChatStore } from "@/lib/store/chat";
import { useUiStore } from "@/lib/store/ui";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
  const activeDate = useUiStore((s) => s.activeDate);
  const dayEntries = useDayEntries(activeDate);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || !chatId || sending) return;
    setInput("");

    const history = (chat?.messages ?? []).map((m) => ({ role: m.role, text: m.text }));
    try {
      await addMessage(chatId, "user", text);
    } catch {
      toast.error("Nie udało się wysłać wiadomości");
      return;
    }

    setSending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          messages: [...history, { role: "user", text }],
          activeDate,
          openDayEntries: dayEntries.map((e) => ({
            mood: e.mood,
            contentText: e.contentText,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.reply) throw new Error(json.error ?? "error");
      await addMessage(chatId, "assistant", json.reply);
    } catch {
      toast.error("Nie udało się połączyć z asystentem. Spróbuj ponownie.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto h-[70vh] max-w-md rounded-t-3xl p-0">
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
              Cześć! Jestem Twoim dziennikowym przyjacielem. Mogę pogadać o tym, jak się
              czujesz, i zajrzeć do Twoich wpisów. O co chcesz zapytać?
            </Bubble>
          ) : (
            chat.messages.map((m) => (
              <Bubble key={m.id} role={m.role}>
                {m.text}
              </Bubble>
            ))
          )}
          {sending && (
            <div className="flex items-center gap-1 self-start rounded-2xl bg-muted px-3 py-2.5">
              <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
            </div>
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
            disabled={sending}
          />
          <Button
            size="icon"
            className="shrink-0 rounded-full"
            aria-label="Wyślij"
            onClick={send}
            disabled={!input.trim() || sending}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Dot({ delay = "0s" }: { delay?: string }) {
  return (
    <span
      className="size-2 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay }}
    />
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
        role === "user"
          ? "self-end bg-primary text-primary-foreground"
          : "self-start bg-muted",
      )}
    >
      {children}
    </div>
  );
}
