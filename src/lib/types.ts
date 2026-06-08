import type { JSONContent } from "@tiptap/react";

/** Skala nastroju 1–5: 1 = bardzo źle, 5 = super ekstra. */
export type Mood = 1 | 2 | 3 | 4 | 5;

/** Pojedynczy wpis dziennika. Bez tytułu — wymagany jest tylko nastrój. */
export type Entry = {
  id: string;
  /** Dzień, którego dotyczy wpis, w formacie YYYY-MM-DD (klucz dnia). */
  date: string;
  /** ISO timestamp utworzenia — do sortowania i wyświetlania godziny. */
  createdAt: string;
  /** ISO timestamp ostatniej edycji. */
  updatedAt: string;
  mood: Mood;
  /** Dokument Tiptap (JSON) lub null, gdy treść pusta. */
  contentJSON: JSONContent | null;
  /** Wersja tekstowa treści — podgląd na kafelku. */
  contentText: string;
};

/** Mock zalogowanego użytkownika (logowanie to placeholder w MVP). */
export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
};

/** Wyliczony stan serii (streak). */
export type StreakState = {
  current: number;
  longest: number;
  lastEntryDate?: string;
};
