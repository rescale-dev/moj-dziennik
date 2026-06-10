import { NextRequest } from "next/server";
import { inferMood } from "@/lib/ai/mood";
import { textToTiptapDoc } from "@/lib/ai/tiptap";
import { warsawDateKey } from "@/lib/date";
import { resolveToken, unauthorized } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const COLS = "id,date,mood,content_json,content_text,created_at,updated_at";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type CreateBody = { text?: string; date?: string; mood?: number };

/** POST /api/v1/entries — dodaje wpis (domyślnie na dziś; mood opcjonalny → AI). */
export async function POST(req: NextRequest) {
  const auth = await resolveToken(req);
  if (!auth) return unauthorized();

  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return Response.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return Response.json({ error: "Pole `text` jest wymagane." }, { status: 400 });
  }

  const date = body.date ?? warsawDateKey();
  if (!DATE_RE.test(date)) {
    return Response.json({ error: "`date` musi mieć format YYYY-MM-DD." }, { status: 400 });
  }

  let mood: number;
  if (body.mood === undefined || body.mood === null) {
    mood = await inferMood(text);
  } else if (Number.isInteger(body.mood) && body.mood >= 1 && body.mood <= 5) {
    mood = body.mood;
  } else {
    return Response.json({ error: "`mood` musi być liczbą całkowitą 1–5." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("entries")
    .insert({
      user_id: auth.userId,
      date,
      mood,
      content_text: text,
      content_json: textToTiptapDoc(text),
    })
    .select(COLS)
    .single();

  if (error) {
    console.error("[POST /api/v1/entries] error:", error);
    return Response.json({ error: "Nie udało się zapisać wpisu." }, { status: 500 });
  }

  return Response.json({ entry: data }, { status: 201 });
}

/** GET /api/v1/entries?date=YYYY-MM-DD — wpisy danego dnia (domyślnie dziś). */
export async function GET(req: NextRequest) {
  const auth = await resolveToken(req);
  if (!auth) return unauthorized();

  const date = req.nextUrl.searchParams.get("date") ?? warsawDateKey();
  if (!DATE_RE.test(date)) {
    return Response.json({ error: "`date` musi mieć format YYYY-MM-DD." }, { status: 400 });
  }

  const { data, error } = await auth.admin
    .from("entries")
    .select(COLS)
    .eq("user_id", auth.userId)
    .eq("date", date)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[GET /api/v1/entries] error:", error);
    return Response.json({ error: "Nie udało się pobrać wpisów." }, { status: 500 });
  }

  return Response.json({ date, entries: data ?? [] });
}
