import type { JSONContent } from "@tiptap/react";
import type { EntryInput } from "../repository";
import type { Entry, Mood } from "../types";
import { supabase } from "./client";

const COLS = "id,date,mood,content_json,content_text,photo_paths,created_at,updated_at";

type Row = {
  id: string;
  date: string;
  mood: number;
  content_json: JSONContent | null;
  content_text: string;
  photo_paths: string[] | null;
  created_at: string;
  updated_at: string;
};

function toEntry(r: Row): Entry {
  return {
    id: r.id,
    date: r.date,
    mood: r.mood as Mood,
    contentJSON: r.content_json,
    contentText: r.content_text,
    photoPaths: r.photo_paths ?? [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function fetchEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select(COLS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(toEntry);
}

export async function insertEntry(input: EntryInput): Promise<Entry> {
  const { data, error } = await supabase
    .from("entries")
    .insert({
      date: input.date,
      mood: input.mood,
      content_json: input.contentJSON,
      content_text: input.contentText,
      photo_paths: input.photoPaths ?? [],
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return toEntry(data as Row);
}

export async function updateEntry(
  id: string,
  patch: Partial<EntryInput>,
): Promise<Entry> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.date !== undefined) dbPatch.date = patch.date;
  if (patch.mood !== undefined) dbPatch.mood = patch.mood;
  if (patch.contentJSON !== undefined) dbPatch.content_json = patch.contentJSON;
  if (patch.contentText !== undefined) dbPatch.content_text = patch.contentText;
  if (patch.photoPaths !== undefined) dbPatch.photo_paths = patch.photoPaths;
  const { data, error } = await supabase
    .from("entries")
    .update(dbPatch)
    .eq("id", id)
    .select(COLS)
    .single();
  if (error) throw error;
  return toEntry(data as Row);
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from("entries").delete().eq("id", id);
  if (error) throw error;
}
