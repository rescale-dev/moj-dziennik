import { supabase } from "./client";

export type ChatRole = "user" | "assistant";
export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
};
export type Chat = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

type ChatRow = { id: string; title: string; created_at: string; updated_at: string };
type MsgRow = {
  id: string;
  chat_id: string;
  role: ChatRole;
  text: string;
  created_at: string;
};

export async function fetchChats(): Promise<Chat[]> {
  const { data: chatRows, error } = await supabase
    .from("chats")
    .select("id,title,created_at,updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const chats = chatRows as ChatRow[];
  const ids = chats.map((c) => c.id);

  let msgs: MsgRow[] = [];
  if (ids.length) {
    const { data, error: mErr } = await supabase
      .from("chat_messages")
      .select("id,chat_id,role,text,created_at")
      .in("chat_id", ids)
      .order("created_at", { ascending: true });
    if (mErr) throw mErr;
    msgs = data as MsgRow[];
  }

  return chats.map((c) => ({
    id: c.id,
    title: c.title,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    messages: msgs
      .filter((m) => m.chat_id === c.id)
      .map((m) => ({ id: m.id, role: m.role, text: m.text, createdAt: m.created_at })),
  }));
}

export async function createChat(): Promise<Chat> {
  const { data, error } = await supabase
    .from("chats")
    .insert({ title: "Nowy czat" })
    .select("id,title,created_at,updated_at")
    .single();
  if (error) throw error;
  const r = data as ChatRow;
  return {
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    messages: [],
  };
}

export async function addMessage(
  chatId: string,
  role: ChatRole,
  text: string,
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ chat_id: chatId, role, text })
    .select("id,role,text,created_at")
    .single();
  if (error) throw error;
  const m = data as Omit<MsgRow, "chat_id">;
  return { id: m.id, role: m.role, text: m.text, createdAt: m.created_at };
}

/** Odświeża `updated_at` czatu (do sortowania) i opcjonalnie ustawia tytuł. */
export async function bumpChat(chatId: string, title?: string): Promise<void> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) patch.title = title;
  const { error } = await supabase.from("chats").update(patch).eq("id", chatId);
  if (error) throw error;
}
