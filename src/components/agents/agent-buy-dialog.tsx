"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type AgentId, getAgent } from "@/lib/agents";
import { stripeCheckoutUrl } from "@/lib/payments";
import { useAgentStore } from "@/lib/store/agent";
import { useUserStore } from "@/lib/store/user";
import { cn } from "@/lib/utils";

export function AgentBuyDialog({
  agentId,
  open,
  onOpenChange,
}: {
  agentId: AgentId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const agent = getAgent(agentId);
  const userId = useUserStore((s) => s.user.id);
  const loadEntitlements = useAgentStore((s) => s.loadEntitlements);
  const selectAgent = useAgentStore((s) => s.selectAgent);
  const [bought, setBought] = useState(false);
  const [checking, setChecking] = useState(false);

  // Reset stanu przy każdym otwarciu.
  useEffect(() => {
    if (open) setBought(false);
  }, [open]);

  const buy = () => {
    const url = stripeCheckoutUrl(userId, agent.id);
    if (!url) {
      toast.error("Brak skonfigurowanego linku płatności.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setBought(true);
  };

  const recheck = async () => {
    setChecking(true);
    try {
      await loadEntitlements();
      if (useAgentStore.getState().owns(agent.id)) {
        selectAgent(agent.id);
        toast.success(`Odblokowano ${agent.name}!`);
        onOpenChange(false);
      } else {
        toast.info("Jeszcze nie widzimy płatności. Spróbuj za chwilę.");
      }
    } catch {
      toast.error("Nie udało się sprawdzić dostępu.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-sm">
        <DialogHeader>
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-full bg-gradient-to-br text-white",
              agent.accent,
            )}
          >
            <Sparkles className="size-5" />
          </span>
          <DialogTitle>{agent.name}</DialogTitle>
          <DialogDescription>{agent.description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button onClick={buy} className="w-full rounded-full">
            Kup teraz za {agent.priceLabel}
          </Button>
          {bought && (
            <Button
              variant="outline"
              onClick={recheck}
              disabled={checking}
              className="w-full rounded-full"
            >
              {checking ? "Sprawdzam…" : "Już zapłaciłem — sprawdź dostęp"}
            </Button>
          )}
        </div>

        {bought && (
          <p className="text-center text-xs text-muted-foreground">
            Po zaksięgowaniu płatności dostęp odblokuje się automatycznie.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
