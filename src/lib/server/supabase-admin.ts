import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klient Supabase z kluczem serwisowym (service role). Omija RLS, więc każda
 * operacja MUSI jawnie podawać/filtrować `user_id`. Używać wyłącznie po stronie
 * serwera (route handlers, skrypty) — nigdy w komponentach klienckich.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      "Brak konfiguracji serwera — ustaw NEXT_PUBLIC_SUPABASE_URL i SUPABASE_SECRET_KEY w .env.local",
    );
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
