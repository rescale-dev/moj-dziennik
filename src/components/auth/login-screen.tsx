"use client";

import { NotebookPen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setRemember as setRememberFlag, supabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setRememberFlag(remember);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: name.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Konto utworzone. Sprawdź skrzynkę i potwierdź e-mail, aby się zalogować.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Coś poszło nie tak");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <NotebookPen className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Mój Dziennik</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Zaloguj się, aby kontynuować" : "Załóż konto, aby zacząć"}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <Input
            type="text"
            autoComplete="name"
            placeholder="Imię"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl"
            required
          />
        )}
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl"
          required
        />
        <Input
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="Hasło"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl"
          required
          minLength={6}
        />
        <label className="flex cursor-pointer items-center gap-2 px-1 py-1 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 rounded accent-primary"
          />
          Zapamiętaj mnie
        </label>
        <Button type="submit" className="w-full rounded-full" disabled={loading}>
          {loading
            ? "Proszę czekać…"
            : mode === "signin"
              ? "Zaloguj się"
              : "Zarejestruj się"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-5 text-center text-sm text-muted-foreground"
      >
        {mode === "signin" ? (
          <>
            Nie masz konta? <span className="font-medium text-primary">Zarejestruj się</span>
          </>
        ) : (
          <>
            Masz już konto? <span className="font-medium text-primary">Zaloguj się</span>
          </>
        )}
      </button>
    </div>
  );
}
