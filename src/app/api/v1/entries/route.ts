import { NextRequest } from "next/server";
import { resolveToken, unauthorized } from "@/lib/server/auth";
import { createEntry, getDayEntries, JournalError } from "@/lib/server/journal";

export const dynamic = "force-dynamic";

function fail(err: unknown): Response {
  if (err instanceof JournalError) return Response.json({ error: err.message }, { status: err.status });
  console.error("[/api/v1/entries] error:", err);
  return Response.json({ error: "Błąd serwera." }, { status: 500 });
}

/** POST /api/v1/entries — dodaje wpis (domyślnie dziś; mood opcjonalny → AI). */
export async function POST(req: NextRequest) {
  const auth = await resolveToken(req);
  if (!auth) return unauthorized();

  let body: { text?: string; date?: string; mood?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  try {
    const entry = await createEntry(auth, body);
    return Response.json({ entry }, { status: 201 });
  } catch (err) {
    return fail(err);
  }
}

/** GET /api/v1/entries?date=YYYY-MM-DD — wpisy danego dnia (domyślnie dziś). */
export async function GET(req: NextRequest) {
  const auth = await resolveToken(req);
  if (!auth) return unauthorized();

  try {
    const result = await getDayEntries(auth, req.nextUrl.searchParams.get("date") ?? undefined);
    return Response.json(result);
  } catch (err) {
    return fail(err);
  }
}
