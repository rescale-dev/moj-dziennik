import type { JSONContent } from "@tiptap/react";
import type { Entry, Mood } from "./types";

/** Dane wejściowe do utworzenia/edycji wpisu (bez pól zarządzanych przez store). */
export type EntryInput = {
  date: string;
  mood: Mood;
  contentJSON: JSONContent | null;
  contentText: string;
  photoPaths?: string[];
};

/**
 * Kontrakt warstwy danych. UI zależy od tego interfejsu, nie od konkretnego
 * magazynu (localStorage), dzięki czemu można go podmienić na backend / RN.
 */
export interface EntryRepository {
  list(): Entry[];
  listByDate(date: string): Entry[];
  add(input: EntryInput): Entry;
  update(id: string, patch: Partial<EntryInput>): void;
  remove(id: string): void;
  allDates(): string[];
}
