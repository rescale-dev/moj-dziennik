"use client";

import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { useAgentStore } from "@/lib/store/agent";
import { useChatStore } from "@/lib/store/chat";
import { useEntriesStore } from "@/lib/store/entries";
import { useUserStore } from "@/lib/store/user";
import { supabase } from "@/lib/supabase/client";

type AuthValue = {
  session: Session | null;
  userId: string | null;
  email: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  userId: null,
  email: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

async function loadAll(user: SupabaseUser) {
  const fallbackName =
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Ja";
  await Promise.allSettled([
    useUserStore.getState().load(user.id, fallbackName),
    useEntriesStore.getState().load(),
    useChatStore.getState().load(),
    useAgentStore.getState().loadEntitlements(),
  ]);
}

function clearAll() {
  useUserStore.getState().clear();
  useEntriesStore.getState().clear();
  useChatStore.getState().clear();
  useAgentStore.getState().clear();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setLoading(false);
      if (newSession && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
        void loadAll(newSession.user);
      } else if (event === "SIGNED_OUT") {
        clearAll();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    session,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
    loading,
    signOut: async () => {
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // nawet przy błędzie sieci czyścimy sesję lokalnie
      }
      setSession(null);
      clearAll();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
