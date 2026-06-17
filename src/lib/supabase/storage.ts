"use client";

import { useEffect, useState } from "react";
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

/** Generuje podpisane URL-e ważne przez `expiresIn` sekund (domyślnie 1 h). */
export async function createSignedUrls(
  paths: string[],
  expiresIn = 3600,
): Promise<string[]> {
  if (!paths.length) return [];
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, expiresIn);
  return (data ?? []).map((d) => d.signedUrl ?? "");
}

/** Hook: zwraca podpisane URL-e dla podanych ścieżek. Puste stringi podczas ładowania. */
export function usePhotoUrls(paths: string[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  const key = paths.join(",");

  useEffect(() => {
    if (!paths.length) { setUrls([]); return; }
    createSignedUrls(paths).then(setUrls);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}
