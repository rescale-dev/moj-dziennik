"use client";

import { Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AGENTS, type AgentId } from "@/lib/agents";
import { useAgentStore } from "@/lib/store/agent";
import { cn } from "@/lib/utils";

export function AgentStoreSheet({
  open,
  onOpenChange,
  onBuy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBuy: (id: AgentId) => void;
}) {
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  // Subskrybcja, by karty reagowały na zmianę uprawnień.
  const ownedAgentIds = useAgentStore((s) => s.ownedAgentIds);
  const selectAgent = useAgentStore((s) => s.selectAgent);

  const ownsAgent = (id: AgentId) => {
    const a = AGENTS.find((x) => x.id === id);
    return !!a && (a.free || ownedAgentIds.includes(id));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[80vh] max-w-md rounded-t-3xl">
        <SheetHeader className="px-1">
          <SheetTitle>Sklep z agentami</SheetTitle>
          <SheetDescription>
            Wybierz, z kim chcesz rozmawiać. Odblokuj płatnych agentów jednorazowo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 overflow-y-auto">
          {AGENTS.map((agent) => {
            const owned = ownsAgent(agent.id);
            const active = selectedAgentId === agent.id;
            return (
              <div
                key={agent.id}
                className={cn(
                  "rounded-2xl border bg-card p-4 shadow-sm",
                  active && "ring-2 ring-primary",
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white",
                      agent.accent,
                    )}
                  >
                    <Sparkles className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{agent.name}</span>
                      {active && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          <Check className="size-3" /> Wybrany
                        </span>
                      )}
                      {!agent.free && !owned && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          <Lock className="size-3" /> {agent.priceLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{agent.tagline}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">{agent.description}</p>

                <div className="mt-3">
                  {!owned ? (
                    <Button onClick={() => onBuy(agent.id)} className="w-full rounded-full">
                      Kup za {agent.priceLabel}
                    </Button>
                  ) : active ? (
                    <Button disabled variant="secondary" className="w-full rounded-full">
                      Aktywny
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        selectAgent(agent.id);
                        onOpenChange(false);
                      }}
                      className="w-full rounded-full"
                    >
                      Wybierz
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
