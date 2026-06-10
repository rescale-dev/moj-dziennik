import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase-admin";

export type AuthContext = {
  /** UID właściciela tokena (auth.users.id). */
  userId: string;
  /** Klient service-key (omija RLS) — operacje muszą filtrować po userId. */
  admin: SupabaseClient;
};

/** SHA-256 (hex) — tak samo liczone tu i w scripts/issue-api-token.mjs. */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Weryfikuje token API z nagłówka `Authorization: Bearer <token>`.
 * Zwraca `null`, gdy brak/zły/odwołany token — wtedy route oddaje 401.
 */
export async function resolveToken(req: Request): Promise<AuthContext | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const admin = createAdminClient();
  const tokenHash = await sha256Hex(token);

  const { data, error } = await admin
    .from("api_tokens")
    .select("id,user_id,revoked")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data || data.revoked) return null;

  // Najlepszym staraniem odświeżamy znacznik użycia (bez blokowania odpowiedzi).
  void admin
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { userId: data.user_id as string, admin };
}

/** Standardowa odpowiedź 401 dla braku/złego tokena. */
export function unauthorized(): Response {
  return Response.json(
    { error: "Brak autoryzacji — podaj nagłówek Authorization: Bearer <token>." },
    { status: 401 },
  );
}
