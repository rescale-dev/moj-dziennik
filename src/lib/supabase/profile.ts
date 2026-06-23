import type { User } from "../types";
import { supabase } from "./client";

type Row = { id: string; name: string; avatar_url: string | null };

const COLS = "id,name,avatar_url";

function toUser(r: Row): User {
  return { id: r.id, name: r.name, avatarUrl: r.avatar_url ?? undefined };
}

/** Pobiera profil; gdy nie istnieje, tworzy go z domyślną nazwą. */
export async function fetchOrCreateProfile(
  userId: string,
  fallbackName: string,
): Promise<User> {
  const { data, error } = await supabase
    .from("profiles")
    .select(COLS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return toUser(data as Row);

  const { data: created, error: insertErr } = await supabase
    .from("profiles")
    .insert({ id: userId, name: fallbackName })
    .select(COLS)
    .single();
  if (insertErr) throw insertErr;
  return toUser(created as Row);
}

export async function updateName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ name }).eq("id", userId);
  if (error) throw error;
}

/** Zapisuje awatar (data URL) w kolumnie profilu, lub czyści gdy null. */
export async function updateAvatar(
  userId: string,
  avatarUrl: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", userId);
  if (error) throw error;
}
