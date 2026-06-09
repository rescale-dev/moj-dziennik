"use client";

import { create } from "zustand";
import * as api from "../supabase/chats";
import type { Chat, ChatRole } from "../supabase/chats";

export type { Chat, ChatMessage, ChatRole } from "../supabase/chats";

type Status = "idle" | "loading" | "ready" | "error";

type ChatState = {
  chats: Chat[];
  status: Status;
  load: () => Promise<void>;
  clear: () => void;
  createChat: () => Promise<string>;
  addMessage: (chatId: string, role: ChatRole, text: string) => Promise<void>;
};

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  status: "idle",
  load: async () => {
    set({ status: "loading" });
    try {
      const chats = await api.fetchChats();
      set({ chats, status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },
  clear: () => set({ chats: [], status: "idle" }),
  createChat: async () => {
    const top = get().chats[0];
    if (top && top.messages.length === 0) return top.id;
    const chat = await api.createChat();
    set({ chats: [chat, ...get().chats] });
    return chat.id;
  },
  addMessage: async (chatId, role, text) => {
    const msg = await api.addMessage(chatId, role, text);
    const chat = get().chats.find((c) => c.id === chatId);
    const isFirstUser = !!chat && chat.messages.length === 0 && role === "user";
    const newTitle = isFirstUser ? text.slice(0, 40) : undefined;
    await api.bumpChat(chatId, newTitle);
    set({
      chats: get().chats.map((c) =>
        c.id === chatId
          ? {
              ...c,
              title: newTitle ?? c.title,
              updatedAt: new Date().toISOString(),
              messages: [...c.messages, msg],
            }
          : c,
      ),
    });
  },
}));
