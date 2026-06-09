import type { User } from "../types";
import { supabase } from "./client";

type Row = { id: string; name: string; avatar_url: string | null };

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
    .select("id,name,avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return toUser(data as Row);

  const { data: created, error: insertErr } = await supabase
    .from("profiles")
    .insert({ id: userId, name: fallbackName })
    .select("id,name,avatar_url")
    .single();
  if (insertErr) throw insertErr;
  return toUser(created as Row);
}

export async function updateName(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ name }).eq("id", userId);
  if (error) throw error;
}

/** Wgrywa awatar do bucketu `avatars/{userId}/avatar` i zapisuje URL w profilu. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `${userId}/avatar`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`; // cache-bust po nadpisaniu
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);
  if (error) throw error;
  return url;
}

export async function removeAvatar(userId: string): Promise<void> {
  await supabase.storage.from("avatars").remove([`${userId}/avatar`]);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", userId);
  if (error) throw error;
}
