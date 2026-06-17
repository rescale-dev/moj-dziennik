"use client";

import { supabase } from "./client";

const BUCKET = "entry-photos";

export async function uploadEntryPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function deleteEntryPhotos(paths: string[]): Promise<void> {
  if (!paths.length) return;
  await supabase.storage.from(BUCKET).remove(paths);
}

export function getPhotoUrl(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
