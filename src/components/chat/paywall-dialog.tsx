"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AI_PRICE_LABEL, stripeCheckoutUrl } from "@/lib/payments";
import { useUserStore } from "@/lib/store/user";

export function PaywallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const userId = useUserStore((s) => s.user.id);
  const refresh = useUserStore((s) => s.refresh);
  const [bought, setBought] = useState(false);
  const [checking, setChecking] = useState(false);

  const buy = () => {
    window.open(stripeCheckoutUrl(userId), "_blank", "noopener,noreferrer");
    setBought(true);
  };

  const recheck = async () => {
    setChecking(true);
    try {
      await refresh();
      if (useUserStore.getState().user.aiUnlocked) {
        toast.success("Dostęp do Agenta AI odblokowany!");
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
          <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
            <Sparkles className="size-5" />
          </span>
          <DialogTitle>Agent AI jest płatny</DialogTitle>
          <DialogDescription>
            Rozmowy z Twoim dziennikowym przyjacielem to funkcja premium.
            Odblokuj ją jednorazową opłatą {AI_PRICE_LABEL} — dostęp zostaje
            na zawsze.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button onClick={buy} className="w-full rounded-full">
            Kup teraz · {AI_PRICE_LABEL}
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
