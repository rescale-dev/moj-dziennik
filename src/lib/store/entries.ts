"use client";

import { create } from "zustand";
import type { EntryInput } from "../repository";
import * as api from "../supabase/entries";
import type { Entry } from "../types";

type Status = "idle" | "loading" | "ready" | "error";

type EntriesState = {
  entries: Entry[];
  status: Status;
  load: () => Promise<void>;
  clear: () => void;
  addEntry: (input: EntryInput) => Promise<Entry>;
  updateEntry: (id: string, patch: Partial<EntryInput>) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
};

export const useEntriesStore = create<EntriesState>((set, get) => ({
  entries: [],
  status: "idle",
  load: async () => {
    set({ status: "loading" });
    try {
      const entries = await api.fetchEntries();
      set({ entries, status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },
  clear: () => set({ entries: [], status: "idle" }),
  addEntry: async (input) => {
    const entry = await api.insertEntry(input);
    set({ entries: [...get().entries, entry] });
    return entry;
  },
  updateEntry: async (id, patch) => {
    const updated = await api.updateEntry(id, patch);
    set({ entries: get().entries.map((e) => (e.id === id ? updated : e)) });
  },
  removeEntry: async (id) => {
    await api.deleteEntry(id);
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },
}));
