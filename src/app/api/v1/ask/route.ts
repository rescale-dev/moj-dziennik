import { NextRequest } from "next/server";
import { resolveToken, unauthorized } from "@/lib/server/auth";
import { askAgent, JournalError } from "@/lib/server/journal";

export const dynamic = "force-dynamic";

/** POST /api/v1/ask — pytanie do agenta (kontekst dnia, historia, zapis do chats). */
export async function POST(req: NextRequest) {
  const auth = await resolveToken(req);
  if (!auth) return unauthorized();

  let body: { question?: string; date?: string; chatId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  try {
    const result = await askAgent(auth, body);
    return Response.json(result);
  } catch (err) {
    if (err instanceof JournalError) return Response.json({ error: err.message }, { status: err.status });
    console.error("[/api/v1/ask] error:", err);
    return Response.json({ error: "Błąd serwera." }, { status: 500 });
  }
}
