"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AgentId, DEFAULT_AGENT_ID, isPaidAgent } from "../agents";
import { fetchOwnedAgentIds } from "../supabase/entitlements";

type AgentState = {
  /** Aktualnie wybrany agent (trwały w localStorage). */
  selectedAgentId: AgentId;
  /** Płatni agenci, do których użytkownik ma uprawnienie. */
  ownedAgentIds: string[];
  /** Czy uprawnienia zostały już pobrane (po zalogowaniu). */
  loaded: boolean;
  selectAgent: (id: AgentId) => void;
  /** Czy użytkownik ma dostęp do agenta (darmowy = zawsze). */
  owns: (id: string) => boolean;
  loadEntitlements: () => Promise<void>;
  clear: () => void;
};

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      selectedAgentId: DEFAULT_AGENT_ID,
      ownedAgentIds: [],
      loaded: false,
      selectAgent: (id) => set({ selectedAgentId: id }),
      owns: (id) => !isPaidAgent(id) || get().ownedAgentIds.includes(id),
      loadEntitlements: async () => {
        try {
          const ids = await fetchOwnedAgentIds();
          set({ ownedAgentIds: ids, loaded: true });
          // Jeśli wybrany agent przestał być dostępny (np. inny użytkownik) → domyślny.
          if (!get().owns(get().selectedAgentId)) set({ selectedAgentId: DEFAULT_AGENT_ID });
        } catch {
          set({ loaded: true });
        }
      },
      clear: () =>
        set({ selectedAgentId: DEFAULT_AGENT_ID, ownedAgentIds: [], loaded: false }),
    }),
    {
      name: "agent-selection",
      // Trwały tylko wybór agenta; uprawnienia pobieramy świeżo po zalogowaniu.
      partialize: (s) => ({ selectedAgentId: s.selectedAgentId }),
    },
  ),
);
