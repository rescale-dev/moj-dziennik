"use client";

import { create } from "zustand";
import { todayKey } from "../date";

type UiState = {
  /** Aktywny dzień (klucz YYYY-MM-DD) widoczny na ekranie głównym. */
  activeDate: string;
  setActiveDate: (date: string) => void;

  /** Stan modala dodawania/edycji wpisu. */
  entryDialogOpen: boolean;
  /** Id edytowanego wpisu lub null, gdy tworzymy nowy. */
  editingEntryId: string | null;
  openNewEntry: () => void;
  openEditEntry: (id: string) => void;
  closeEntryDialog: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeDate: todayKey(),
  setActiveDate: (date) => set({ activeDate: date }),

  entryDialogOpen: false,
  editingEntryId: null,
  openNewEntry: () => set({ entryDialogOpen: true, editingEntryId: null }),
  openEditEntry: (id) => set({ entryDialogOpen: true, editingEntryId: id }),
  closeEntryDialog: () => set({ entryDialogOpen: false, editingEntryId: null }),
}));
