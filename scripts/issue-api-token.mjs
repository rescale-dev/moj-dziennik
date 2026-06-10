#!/usr/bin/env node
// Generuje długożyciowy token API dla użytkownika i zapisuje JEGO HASH (SHA-256)
// w public.api_tokens. Token w postaci jawnej jest wypisany RAZ na stdout —
// zapisz go bezpiecznie, nie da się go odzyskać później.
//
// Użycie:
//   node scripts/issue-api-token.mjs <user_id> ["etykieta"]
//
// Wymaga w .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY.

import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  try {
    const file = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
    for (const line of file.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* brak pliku — polegamy na zmiennych środowiskowych */
  }
}

loadEnvLocal();

const userId = process.argv[2];
const label = process.argv[3] ?? "api-token";

if (!userId) {
  console.error("Użycie: node scripts/issue-api-token.mjs <user_id> [\"etykieta\"]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SECRET_KEY (.env.local).");
  process.exit(1);
}

const token = `mojd_${randomBytes(32).toString("base64url")}`;
const tokenHash = createHash("sha256").update(token).digest("hex");

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { error } = await supabase
  .from("api_tokens")
  .insert({ user_id: userId, token_hash: tokenHash, label });

if (error) {
  console.error("Nie udało się zapisać tokena:", error.message);
  process.exit(1);
}

console.log("\n✅ Token utworzony. Zapisz go teraz — nie pokażemy go ponownie:\n");
console.log(`   ${token}\n`);
console.log(`   user_id: ${userId}`);
console.log(`   etykieta: ${label}\n`);
console.log("Użycie w żądaniu:  Authorization: Bearer " + token + "\n");
