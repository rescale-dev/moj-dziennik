"use client";

import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Generator tokenu API w pasku docs — mintuje token dla zalogowanego użytkownika. */
export function TokenGenerator() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setLoggedIn(!!data.session));
  }, []);

  // Zamknięcie panelu po kliknięciu poza nim.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setToken(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoggedIn(false);
        return;
      }
      const res = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ label: "docs" }),
      });
      const json = await res.json();
      if (!res.ok || !json.token) throw new Error(json.error ?? "Błąd");
      setToken(json.token);
    } catch (e) {
      setError((e as Error).message || "Nie udało się wygenerować tokena.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <KeyRound className="size-4" />
        Token API
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-card p-4 shadow-lg">
          <p className="text-sm font-medium">Token API</p>

          {loggedIn === false ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Aby wygenerować token, najpierw{" "}
              <Link href="/" className="text-primary hover:underline">
                zaloguj się w aplikacji
              </Link>
              .
            </p>
          ) : token ? (
            <div className="mt-3">
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
                <code className="min-w-0 flex-1 truncate font-mono text-xs">{token}</code>
                <button
                  type="button"
                  onClick={copy}
                  aria-label="Kopiuj token"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {copied ? (
                    <Check className="size-4 text-emerald-500" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                Skopiuj teraz — nie pokażemy go ponownie.
              </p>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                Wygeneruj długożyciowy token dla swojego konta. Użyj go w nagłówku{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">Authorization</code>.
              </p>
              <Button
                size="sm"
                className={cn("mt-3 w-full gap-1.5")}
                onClick={generate}
                disabled={loading}
              >
                {loading && <Loader2 className="size-4 animate-spin" />}
                Wygeneruj token
              </Button>
              {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
