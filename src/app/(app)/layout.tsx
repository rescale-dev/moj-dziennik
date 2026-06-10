import { AuthGate } from "@/components/auth/auth-gate";

/** Powłoka aplikacji mobilnej (wąski kontener + bramka logowania). */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <AuthGate>{children}</AuthGate>
    </div>
  );
}
