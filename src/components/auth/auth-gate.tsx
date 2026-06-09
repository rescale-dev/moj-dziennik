"use client";

import { NewEntryDialog } from "@/components/entry/new-entry-dialog";
import { BottomNav } from "@/components/nav/bottom-nav";
import { useAuth } from "./auth-provider";
import { LoginScreen } from "./login-screen";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  return (
    <>
      <main className="flex-1 pb-28">{children}</main>
      <BottomNav />
      <NewEntryDialog />
    </>
  );
}
