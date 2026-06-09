"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Brak konfiguracji Supabase — ustaw NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY w .env.local",
  );
}

/** Flaga „Zapamiętaj mnie": gdy false, sesja idzie do sessionStorage
 *  (znika po zamknięciu karty); gdy true — do localStorage (auto-login). */
export const REMEMBER_KEY = "moj-dziennik:remember";

export function setRemember(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
}

/** Magazyn sesji wybierający local/sessionStorage zależnie od „Zapamiętaj mnie". */
const hybridStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    const remember = window.localStorage.getItem(REMEMBER_KEY) !== "false";
    if (remember) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

/** Klient Supabase dla przeglądarki. */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: hybridStorage,
  },
});
