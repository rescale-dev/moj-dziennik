"use client";

import { Check, ChevronDown, Star, Store } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AGENTS, type AgentId, getAgent } from "@/lib/agents";
import { useAgentStore } from "@/lib/store/agent";
import { AgentBuyDialog } from "./agent-buy-dialog";
import { AgentStoreSheet } from "./agent-store-sheet";

/** Przełącznik agenta + skrót „Kup Muska" w prawym górnym rogu nagłówka. */
export function AgentControls() {
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const ownedAgentIds = useAgentStore((s) => s.ownedAgentIds);
  const selectAgent = useAgentStore((s) => s.selectAgent);
  const selected = getAgent(selectedAgentId);

  const owns = (id: AgentId) => {
    const a = AGENTS.find((x) => x.id === id);
    return !!a && (a.free || ownedAgentIds.includes(id));
  };
  const ownedAgents = AGENTS.filter((a) => owns(a.id));
  const muskOwned = owns("musk");

  const [storeOpen, setStoreOpen] = useState(false);
  const [buyAgent, setBuyAgent] = useState<AgentId | null>(null);

  return (
    <>
      {!muskOwned && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-amber-500"
          aria-label="Kup Muska"
          onClick={() => setBuyAgent("musk")}
        >
          <Star className="size-5" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-1 rounded-full">
            {selected.name}
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {ownedAgents.map((a) => (
            <DropdownMenuItem key={a.id} onClick={() => selectAgent(a.id)}>
              <span className="flex-1">{a.name}</span>
              {selectedAgentId === a.id && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setStoreOpen(true)}>
            <Store className="size-4" />
            Sklep z agentami
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AgentStoreSheet
        open={storeOpen}
        onOpenChange={setStoreOpen}
        onBuy={(id) => {
          setStoreOpen(false);
          setBuyAgent(id);
        }}
      />
      <AgentBuyDialog
        agentId={buyAgent ?? "musk"}
        open={buyAgent !== null}
        onOpenChange={(o) => {
          if (!o) setBuyAgent(null);
        }}
      />
    </>
  );
}
