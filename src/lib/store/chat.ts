"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; text: string };
export type Chat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

/** Przykładowe historie czatów (placeholdery — prawdziwego AI jeszcze nie ma). */
const SEED: Chat[] = [
  {
    id: "seed-1",
    title: "Jak poprawić nastrój wieczorem?",
    createdAt: "2026-06-07T20:10:00.000Z",
    updatedAt: "2026-06-07T20:14:00.000Z",
    messages: [
      { role: "user", text: "Mam gorszy wieczór, co mogę zrobić?" },
      {
        role: "assistant",
        text: "Spróbuj krótkiego spaceru i zapisz jedną rzecz, za którą jesteś dziś wdzięczny. (wersja demonstracyjna)",
      },
    ],
  },
  {
    id: "seed-2",
    title: "Podsumuj mój tydzień",
    createdAt: "2026-06-05T09:00:00.000Z",
    updatedAt: "2026-06-05T09:02:00.000Z",
    messages: [
      { role: "user", text: "Podsumuj mój nastrój z ostatniego tygodnia." },
      {
        role: "assistant",
        text: "W tym tygodniu przeważał spokój, z jednym trudniejszym dniem. (wersja demonstracyjna)",
      },
    ],
  },
  {
    id: "seed-3",
    title: "Pomysły na wpis",
    createdAt: "2026-06-02T18:30:00.000Z",
    updatedAt: "2026-06-02T18:31:00.000Z",
    messages: [
      { role: "user", text: "O czym mogę dziś napisać?" },
      {
        role: "assistant",
        text: "Napisz o jednym małym sukcesie i jednej rzeczy, której się nauczyłeś. (wersja demonstracyjna)",
      },
    ],
  },
];

type ChatState = {
  chats: Chat[];
  /** Tworzy nowy czat (lub zwraca istniejący pusty na górze) i zwraca jego id. */
  createChat: () => string;
  addMessage: (id: string, msg: ChatMessage) => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: SEED,
      createChat: () => {
        const top = get().chats[0];
        if (top && top.messages.length === 0) return top.id;
        const id = nanoid();
        const now = new Date().toISOString();
        set({
          chats: [
            { id, title: "Nowy czat", createdAt: now, updatedAt: now, messages: [] },
            ...get().chats,
          ],
        });
        return id;
      },
      addMessage: (id, msg) =>
        set({
          chats: get().chats.map((c) =>
            c.id === id
              ? {
                  ...c,
                  messages: [...c.messages, msg],
                  updatedAt: new Date().toISOString(),
                  title:
                    c.messages.length === 0 && msg.role === "user"
                      ? msg.text.slice(0, 40)
                      : c.title,
                }
              : c,
          ),
        }),
    }),
    { name: "moj-dziennik:chats", version: 1 },
  ),
);
