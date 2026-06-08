"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EntryInput } from "../repository";
import type { Entry } from "../types";

type EntriesState = {
  entries: Entry[];
  addEntry: (input: EntryInput) => Entry;
  updateEntry: (id: string, patch: Partial<EntryInput>) => void;
  removeEntry: (id: string) => void;
};

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (input) => {
        const now = new Date().toISOString();
        const entry: Entry = {
          id: nanoid(),
          createdAt: now,
          updatedAt: now,
          ...input,
        };
        set({ entries: [...get().entries, entry] });
        return entry;
      },
      updateEntry: (id, patch) =>
        set({
          entries: get().entries.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
          ),
        }),
      removeEntry: (id) => set({ entries: get().entries.filter((e) => e.id !== id) }),
    }),
    {
      name: "moj-dziennik:entries",
      version: 1,
    },
  ),
);
