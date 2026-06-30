# Architektura — „Mój Dziennik"

Osobisty dziennik nastroju z asystentami AI. Aplikacja webowa (Next.js) +
Supabase (Postgres, Auth, Storage) + modele AI (Gemini, OpenAI embeddings).

> Ten dokument opisuje, **gdzie co mieszka** i **jak elementy się łączą**.
> Zawiera wyłącznie nazwy zmiennych środowiskowych — żadnych sekretów.

---

## 1. Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind v4, shadcn/radix-ui |
| Edytor wpisów | Tiptap (rich text, JSON) |
| Stan klienta | Zustand (stores per domena) |
| Backend | Next.js Route Handlers (`src/app/api/**`) |
| Baza / Auth / Storage | Supabase (Postgres 17 + pgvector, GoTrue, Storage) |
| AI — rozmowa | Google Gemini 2.5 Flash (function calling) |
| AI — embeddingi | OpenAI `text-embedding-3-small` (1536 wym.) |
| Płatności | Stripe Payment Links + webhook |
| Hosting | Vercel (produkcja: `moj-dziennik-delta.vercel.app`) |

---

## 2. Model danych (Postgres / Supabase)

```
auth.users ──1:1── profiles
     │
     ├──1:N── entries            (wpisy: mood 1–5, treść, embedding, photo_paths[])
     ├──1:N── chats ──1:N── chat_messages
     ├──1:N── api_tokens         (tokeny do publicznego API v1)
     └──1:N── agent_entitlements (kupieni płatni agenci)

storage: bucket „entry-photos" (prywatny, ścieżki {userId}/{uuid}.{ext})
```

Tabele (`public`):

- **profiles** — `id` (= auth.uid), `name`, `avatar_url`.
- **entries** — `id`, `user_id`, `date`, `mood` (smallint 1–5), `content_json`
  (Tiptap), `content_text`, `embedding` (vector 1536, indeks HNSW), `photo_paths`
  (text[]), znaczniki czasu.
- **chats** / **chat_messages** — historia rozmów z agentami.
- **api_tokens** — hash tokena + `user_id`; autoryzacja publicznego API v1.
- **agent_entitlements** — `(user_id, agent_id)` PK; jeden wiersz = użytkownik
  posiada płatnego agenta. `source`, `stripe_session_id`.

### RPC

- **`match_entries_hybrid(p_user_id, p_embedding, p_query, p_mood, p_match_count)`**
  — wyszukiwanie hybrydowe (sekcja 4). `SECURITY INVOKER`, działa zarówno z RLS
  (anon + JWT → `auth.uid()`), jak i z kluczem serwisowym (`p_user_id` podany).

---

## 3. Bezpieczeństwo (RLS, granty, Storage)

- **RLS** włączone na wszystkich tabelach. Polityki typu „własny wiersz":
  `auth.uid() = user_id`. Użytkownik widzi/edytuje wyłącznie swoje dane.
- **`agent_entitlements`** — RLS pozwala użytkownikowi tylko **czytać** swoje
  uprawnienia (`SELECT`). **Brak** polityk INSERT/UPDATE/DELETE → zapisać może
  wyłącznie rola serwisowa (webhook Stripe). Użytkownik nie odblokuje się sam.
- **Granty (gotcha tego projektu):** domyślne przywileje są ograniczone, więc
  każda nowa tabela wymaga jawnego `GRANT`. Dla `agent_entitlements`:
  `authenticated` → SELECT, `service_role` → SELECT/INSERT/UPDATE/DELETE.
  Bez tego webhook dostaje `42501 permission denied` (zapis się nie powiedzie).
- **Storage** — bucket `entry-photos` jest **prywatny**. Polityka: ścieżka musi
  zaczynać się od `auth.uid()`. Wyświetlanie przez **signed URL** (TTL 1h),
  nie publiczne URL-e. Upload: walidacja MIME + limit 10 MB, rozszerzenie z MIME
  (nie z nazwy pliku).
- **Klucze API** trzymane wyłącznie po stronie serwera (`*_SECRET_KEY`,
  `GEMINI_API_KEY`, `OPENAI_API_KEY`, `STRIPE_WEBHOOK_SECRET`). Do przeglądarki
  trafia tylko `NEXT_PUBLIC_*` (URL + klucz publishable/anon — chronione RLS).

---

## 4. AI — wyszukiwanie hybrydowe + RAG

### Wyszukiwanie hybrydowe (`match_entries_hybrid`)

Łączy dwa „ramiona" i scala wynik metodą **Reciprocal Rank Fusion (RRF, k=60)**:

```
ramię wektorowe: embedding pytania  ↔  entries.embedding   (operator <=> , cosine)
ramię tekstowe:  ILIKE %fraza%       na content_text
RRF: score = 1/(60+rank_vec) + 1/(60+rank_txt)   (FULL OUTER JOIN po id)
→ top N
```

### RAG w agencie (`src/lib/ai/agent.ts`)

1. **Pre-fetch:** przed wywołaniem Gemini liczony jest embedding ostatniego
   pytania i wołane `match_entries_hybrid` (ramię wektorowe) → top-15 wpisów.
2. Wpisy wstrzykiwane do promptu systemowego (`buildSystemPrompt`).
3. Gemini ma też **narzędzia** (function calling) używane proaktywnie:
   `get_entries_by_date`, `get_entries_in_range`, `search_entries`
   (to ostatnie również woła hybrydę).
4. Embeddingi wpisów liczone są przy zapisie (`createEntry`) i trzymane w
   `entries.embedding`.

---

## 5. Agenci AI (darmowy + płatny)

Rejestr: **`src/lib/agents.ts`** — źródło prawdy.

| id | nazwa | dostęp | persona |
|---|---|---|---|
| `friend` | Asystent AI | darmowy (domyślny) | ciepły, empatyczny przyjaciel |
| `musk` | Musk AI | płatny (5 zł) | surowy, pierwsze zasady, ruch na dziś |

- Persony i few-shoty: `src/lib/ai/prompt.ts` (`buildSystemPrompt(agentId, …)`).
  PRD Muska: [`docs/musk-ai-prd.md`](docs/musk-ai-prd.md).
- Wybór agenta: `src/lib/store/agent.ts` (Zustand, wybór trwały w localStorage;
  uprawnienia ładowane po zalogowaniu z `agent_entitlements`).
- UI: `src/components/agents/*` — przełącznik + gwiazdka „Kup Muska" w nagłówku,
  galeria-sklep (`AgentStoreSheet`), popup zakupu (`AgentBuyDialog`).
- **Bramka serwerowa:** `/api/chat` dla płatnego agenta sprawdza wpis w
  `agent_entitlements` i zwraca **402**, jeśli brak — nie da się ominąć UI.

---

## 6. Płatności (Stripe) — pełna pętla

```
[Kup teraz] ──▶ Stripe Payment Link
                 ?client_reference_id = <userId>__<agentId>
                       │
                  (opłata kartą)
                       │
        Stripe ──▶ POST /api/stripe/webhook   (checkout.session.completed)
                       │  1. weryfikacja podpisu (HMAC-SHA256, Stripe-Signature)
                       │  2. parse client_reference_id → { userId, agentId }
                       │  3. upsert agent_entitlements  (klucz serwisowy)
                       ▼
        klient: „sprawdź dostęp" / reload → odczyt entitlements → agent odblokowany
```

- Link i kod: `src/lib/payments.ts` (`stripeCheckoutUrl`, `parseClientReferenceId`).
- Webhook: `src/app/api/stripe/webhook/route.ts`. Podpis weryfikowany bez SDK
  (`node:crypto`, tolerancja 5 min na replay). Zapis idempotentny
  (`onConflict user_id,agent_id`).
- Atrybucja płatności do użytkownika: `client_reference_id = <userId>__<agentId>`
  doklejany do URL linku → „nie ginie między systemami".

---

## 7. API (Route Handlers)

| Endpoint | Auth | Rola |
|---|---|---|
| `POST /api/chat` | JWT użytkownika (RLS) | rozmowa z wybranym agentem + bramka 402 |
| `POST /api/stripe/webhook` | podpis Stripe | odblokowanie płatnego agenta |
| `GET/POST /api/v1/entries` | token API (`api_tokens`) | publiczne tworzenie/odczyt wpisów |
| `POST /api/v1/ask` | token API | publiczne pytanie do agenta |
| `/api/[transport]` | — | serwer MCP (narzędzia dziennika) |
| `GET /api/time` | — | pomocniczy |

Wspólna logika domenowa: `src/lib/server/journal.ts` (współdzielona przez
czat w UI i publiczne API). Klient serwisowy: `src/lib/server/supabase-admin.ts`.

---

## 8. Frontend

```
src/
├─ app/(app)/         strony aplikacji (home, /calendar, /stats) + layout z Auth
├─ app/docs/          dokumentacja API v1
├─ app/api/           Route Handlers (sekcja 7)
├─ components/
│  ├─ agents/         przełącznik agenta, sklep, popup zakupu
│  ├─ chat/           AiChatSheet, historia czatów
│  ├─ entry/          edytor wpisu (Tiptap), zdjęcia
│  ├─ home/           nagłówek, lista wpisów
│  └─ nav/            dolna nawigacja (FAB AI, „+")
└─ lib/
   ├─ ai/             agent.ts, prompt.ts, embed.ts, mood.ts
   ├─ store/          Zustand: user, entries, chat, agent, ui
   ├─ supabase/       client, entries, profile, entitlements, storage
   └─ server/         journal.ts, supabase-admin.ts
```

Stores (Zustand) ładowane po zalogowaniu (`auth-provider.tsx`): `user`,
`entries`, `chat`, `agent` (uprawnienia). Wylogowanie czyści wszystkie.

---

## 9. Zmienne środowiskowe (tylko nazwy)

Serwer (tajne — nigdy do przeglądarki):
- `SUPABASE_SECRET_KEY` — klucz serwisowy (omija RLS): API v1, webhook, skrypty.
- `GEMINI_API_KEY` — Gemini (rozmowa).
- `OPENAI_API_KEY` — embeddingi (wyszukiwanie wektorowe).
- `STRIPE_WEBHOOK_SECRET` — weryfikacja podpisu webhooka.

Publiczne (`NEXT_PUBLIC_*`, w bundlu klienta — chronione RLS):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_LINK_MUSK` (link płatności — z założenia publiczny).

Wzorzec: [`.env.example`](.env.example).

---

## 10. Wdrożenie

- Hosting: **Vercel**, auto-deploy z gałęzi `main`.
- Domena produkcyjna: **`moj-dziennik-delta.vercel.app`**.
- Webhook Stripe musi wskazywać: `https://<domena>/api/stripe/webhook`,
  zdarzenie `checkout.session.completed`.
- Migracje bazy: Supabase (katalog migracji + RPC `match_entries_hybrid`).
