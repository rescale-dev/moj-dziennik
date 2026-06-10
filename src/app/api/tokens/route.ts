import { createClient } from "@supabase/supabase-js";
import { sha256Hex } from "@/lib/server/auth";
import { createAdminClient } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/tokens — generuje długożyciowy token API dla ZALOGOWANEGO użytkownika.
 * Autoryzacja: token sesji Supabase (JWT) w nagłówku Authorization: Bearer.
 * Zwraca jawny token tylko raz; w bazie zapisywany jest jedynie jego hash.
 */
export async function POST(req: Request) {
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!jwt) {
    return Response.json({ error: "Zaloguj się, aby wygenerować token." }, { status: 401 });
  }

  // Walidacja sesji użytkownika kluczem anon (RLS/JWT) — ustala jego user_id.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const {
    data: { user },
    error: userErr,
  } = await anon.auth.getUser(jwt);
  if (userErr || !user) {
    return Response.json({ error: "Sesja wygasła — zaloguj się ponownie." }, { status: 401 });
  }

  let label = "docs";
  try {
    const body = (await req.json()) as { label?: string };
    if (body?.label?.trim()) label = body.label.trim().slice(0, 60);
  } catch {
    /* brak body — używamy domyślnej etykiety */
  }

  // Token: mojd_<32B base64url>. Zapisujemy tylko SHA-256.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = `mojd_${Buffer.from(bytes).toString("base64url")}`;
  const tokenHash = await sha256Hex(token);

  const admin = createAdminClient();
  const { error } = await admin
    .from("api_tokens")
    .insert({ user_id: user.id, token_hash: tokenHash, label });

  if (error) {
    console.error("[POST /api/tokens] error:", error);
    return Response.json({ error: "Nie udało się utworzyć tokena." }, { status: 500 });
  }

  return Response.json({ token, label }, { status: 201 });
}
