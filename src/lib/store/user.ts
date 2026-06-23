"use client";

import { create } from "zustand";
import { fileToResizedDataUrl } from "../image";
import * as api from "../supabase/profile";
import type { User } from "../types";

type UserState = {
  user: User;
  load: (userId: string, fallbackName: string) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
  setName: (name: string) => Promise<void>;
  setAvatarFile: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
};

const EMPTY: User = { id: "", name: "", aiUnlocked: false };

export const useUserStore = create<UserState>((set, get) => ({
  user: EMPTY,
  load: async (userId, fallbackName) => {
    const user = await api.fetchOrCreateProfile(userId, fallbackName);
    set({ user });
  },
  refresh: async () => {
    const { id } = get().user;
    if (!id) return;
    const fresh = await api.fetchProfile(id);
    if (fresh) set({ user: fresh });
  },
  clear: () => set({ user: EMPTY }),
  setName: async (name) => {
    const { id } = get().user;
    if (!id) return;
    set({ user: { ...get().user, name } });
    await api.updateName(id, name);
  },
  setAvatarFile: async (file) => {
    const { id } = get().user;
    if (!id) return;
    const dataUrl = await fileToResizedDataUrl(file);
    await api.updateAvatar(id, dataUrl);
    set({ user: { ...get().user, avatarUrl: dataUrl } });
  },
  removeAvatar: async () => {
    const { id } = get().user;
    if (!id) return;
    await api.updateAvatar(id, null);
    set({ user: { ...get().user, avatarUrl: undefined } });
  },
}));
