"use client";

import { create } from "zustand";
import * as api from "../supabase/profile";
import type { User } from "../types";

type UserState = {
  user: User;
  load: (userId: string, fallbackName: string) => Promise<void>;
  clear: () => void;
  setName: (name: string) => Promise<void>;
  setAvatarFile: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
};

const EMPTY: User = { id: "", name: "" };

export const useUserStore = create<UserState>((set, get) => ({
  user: EMPTY,
  load: async (userId, fallbackName) => {
    const user = await api.fetchOrCreateProfile(userId, fallbackName);
    set({ user });
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
    const url = await api.uploadAvatar(id, file);
    set({ user: { ...get().user, avatarUrl: url } });
  },
  removeAvatar: async () => {
    const { id } = get().user;
    if (!id) return;
    await api.removeAvatar(id);
    set({ user: { ...get().user, avatarUrl: undefined } });
  },
}));
