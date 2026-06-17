import { createClient } from "@supabase/supabase-js";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY;
const MODEL = "text-embedding-3-small";
const BATCH = 100; // max OpenAI batch size

if (!OPENAI_KEY || !SUPABASE_URL || !SERVICE_KEY) {
  console.error("Brak zmiennych środowiskowych (OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY)");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { persistSession: false });

async function embedBatch(texts) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

async function main() {
  // Pobierz wszystkie wpisy bez embeddingu
  const { data: rows, error } = await admin
    .from("entries")
    .select("id, content_text")
    .is("embedding", null)
    .order("date", { ascending: true });

  if (error) throw error;
  console.log(`Wpisy bez embeddingu: ${rows.length}`);

  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const texts = chunk.map((r) => r.content_text || "");

    const embeddings = await embedBatch(texts);

    // Aktualizuj każdy wpis (upsert przez update)
    const updates = chunk.map((r, j) =>
      admin.from("entries").update({ embedding: embeddings[j] }).eq("id", r.id)
    );
    await Promise.all(updates);

    done += chunk.length;
    console.log(`✓ ${done}/${rows.length} embeddingów zapisanych`);
  }

  console.log("Gotowe!");
}

main().catch((e) => { console.error(e); process.exit(1); });
