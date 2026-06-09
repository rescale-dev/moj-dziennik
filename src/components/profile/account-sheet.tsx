"use client";

import { KeyRound, LogOut, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/lib/supabase/client";

export function AccountSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { email, signOut } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "email" | "password">(null);

  const changeEmail = async () => {
    const value = newEmail.trim();
    if (!value || value === email) return;
    setBusy("email");
    try {
      const { error } = await supabase.auth.updateUser({ email: value });
      if (error) throw error;
      toast.success("Sprawdź skrzynkę — wysłaliśmy link potwierdzający nowy e-mail.");
      setNewEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zmienić e-maila");
    } finally {
      setBusy(null);
    }
  };

  const changePassword = async () => {
    if (password.length < 6) {
      toast.error("Hasło musi mieć min. 6 znaków");
      return;
    }
    setBusy("password");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Hasło zostało zmienione.");
      setPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nie udało się zmienić hasła");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-md rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Logowanie i konto</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-2">
          {/* E-mail */}
          <div className="space-y-2">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              E-mail
            </p>
            <p className="px-1 text-sm text-muted-foreground">
              Zalogowano jako <span className="text-foreground">{email}</span>
            </p>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Nowy e-mail"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-xl"
            />
            <Button
              onClick={changeEmail}
              disabled={busy !== null || !newEmail.trim()}
              className="w-full rounded-full"
            >
              <Mail className="size-4" />
              {busy === "email" ? "Wysyłanie…" : "Zmień e-mail"}
            </Button>
          </div>

          {/* Hasło */}
          <div className="space-y-2">
            <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Hasło
            </p>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Nowe hasło (min. 6 znaków)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl"
            />
            <Button
              onClick={changePassword}
              disabled={busy !== null || password.length < 6}
              className="w-full rounded-full"
            >
              <KeyRound className="size-4" />
              {busy === "password" ? "Zapisywanie…" : "Zmień hasło"}
            </Button>
          </div>

          {/* Wyloguj */}
          <Button
            variant="outline"
            onClick={signOut}
            className="w-full rounded-full text-destructive"
          >
            <LogOut className="size-4" />
            Wyloguj się
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
