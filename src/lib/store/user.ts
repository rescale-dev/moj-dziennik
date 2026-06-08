"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

type UserState = {
  user: User;
  setName: (name: string) => void;
  setAvatar: (avatarUrl?: string) => void;
};

/** Mock zalogowanego użytkownika — logowanie to placeholder w MVP.
 *  Zdjęcie trzymamy jako data URL w localStorage. */
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: { id: "local-user", name: "Damian" },
      setName: (name) => set({ user: { ...get().user, name } }),
      setAvatar: (avatarUrl) => set({ user: { ...get().user, avatarUrl } }),
    }),
    { name: "moj-dziennik:user", version: 1 },
  ),
);
