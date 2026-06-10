---
name: add-journal-entry
description: Dodaje nowy wpis do dziennika „Mój Dziennik" (Supabase) na wskazany dzień — domyślnie dziś. Nastrój w skali 1–5 wnioskuje z treści wpisu, a po zapisie weryfikuje, że wiersz powstał poprawnie. Używaj, gdy użytkownik chce dodać/zapisać wpis do dziennika, np. „dodaj wpis", „zapisz w dzienniku", „zanotuj że…", „wpis na wczoraj", „dodaj wpis na 2026-06-08".
---

# Dodawanie wpisu do dziennika „Mój Dziennik"

Wpisy trzymane są w Supabase (projekt **`ragbmfakparsjwgukshq`**), tabela `public.entries`.
Operuj przez narzędzie MCP **`execute_sql`** tego projektu.

## Schemat `public.entries`
- `id uuid` (auto), `user_id uuid` (właściciel), `date date` (dzień wpisu),
- `mood smallint` CHECK 1–5, `content_text text`, `content_json jsonb` (dokument Tiptap),
- `created_at`, `updated_at` (auto).

> Ważne: `execute_sql` działa z uprawnieniami serwisowymi i **omija RLS**, a `auth.uid()` jest tam NULL.
> Dlatego `user_id` musisz podać jawnie (patrz krok 2).

## Skala nastroju (1–5)
- 1 = Bardzo źle 😢 — smutek, kryzys, rozpacz, „beznadziejnie"
- 2 = Źle 😔 — przygnębienie, stres, zmęczenie, rozczarowanie
- 3 = Neutralnie 😐 — zwyczajnie, spokojnie, „w porządku"
- 4 = Dobrze 🙂 — zadowolenie, satysfakcja, miło
- 5 = Super ekstra 🤩 — radość, ekscytacja, świetny dzień

## Kroki

### 1. Ustal dane wejściowe
- **Treść** (`TEXT`): to, co użytkownik chce zapisać. Jeśli nie podał wprost treści, dopytaj.
- **Data** (`DATE`, format `YYYY-MM-DD`): domyślnie **dziś** w strefie Polski. Możesz ją wyliczyć w SQL jako
  `(now() at time zone 'Europe/Warsaw')::date`, albo wstawić konkretną datę. Terminy względne rozwiń sam
  („wczoraj" = dziś − 1 dzień, „przedwczoraj" = − 2 itd.) i podaj jako literał `YYYY-MM-DD`.
- **Nastrój**: jeśli użytkownik podał wprost (np. „nastrój 4"), użyj tego. W przeciwnym razie **wywnioskuj 1–5
  z treści** wg skali wyżej. Trzymaj się tonu wypowiedzi, nie dramatyzuj ani nie zaniżaj.

### 2. `user_id` — właściciel wpisu (skonfigurowany na stałe)
Domyślny właściciel to **Damian**:

```
USER_ID = 41a0bc5a-d4a1-49cf-b1b9-6297c77b8b97
```

Użyj tego UID jako `user_id` w insertcie — **nie** trzeba pytać o profil ani odpytywać `public.profiles`.
Tylko jeśli użytkownik wyraźnie poprosi o dodanie wpisu komuś innemu, ustal właściwy `id`:
```sql
select id, name from public.profiles;
```

### 3. Wstaw wpis
Użyj dollar-quoting (`$ENTRY$ … $ENTRY$`) dla treści i `jsonb_build_object` dla `content_json`,
żeby nie martwić się o escapowanie cudzysłowów. Podstaw wyliczone `USER_ID`, `MOOD`, datę i treść:

```sql
insert into public.entries (user_id, date, mood, content_text, content_json)
values (
  '41a0bc5a-d4a1-49cf-b1b9-6297c77b8b97'::uuid,   -- USER_ID = Damian (z kroku 2)
  'YYYY-MM-DD'::date,                      -- lub: (now() at time zone 'Europe/Warsaw')::date dla dziś
  MOOD,                                    -- liczba 1..5
  $ENTRY$TEXT$ENTRY$,
  jsonb_build_object(
    'type','doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type','paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type','text','text', $ENTRY$TEXT$ENTRY$)
        )
      )
    )
  )
)
returning id, date, mood, content_text, created_at;
```
- Jeśli treść jest pusta, ustaw `content_text` na `''` i `content_json` na `NULL`.
- `MOOD` musi być z zakresu 1–5 (inaczej CHECK odrzuci insert).

### 4. Zweryfikuj zapis (obowiązkowo)
Po insertcie potwierdź, że wiersz istnieje i ma poprawne wartości — najlepiej po `id` z `returning`:
```sql
select id, date, mood, left(content_text, 120) as preview, created_at
from public.entries
where id = 'ZWROCONE_ID'::uuid;
```
Sprawdź, że: zwrócono **dokładnie 1** wiersz, `date` = oczekiwana data, `mood` = ustawiona wartość,
a `preview` odpowiada treści. Jeśli czegoś brakuje lub nie zgadza się — zgłoś problem i nie twierdź, że zapisano.

### 5. Podsumuj użytkownikowi
Krótko potwierdź: datę (słownie), nastrój jako liczbę **i** etykietę z emoji (np. „4/5 🙂 Dobrze"),
oraz że wpis zweryfikowano w bazie. Jeśli nastrój był wywnioskowany (nie podany), zaznacz to i zaproponuj zmianę,
gdyby użytkownik się nie zgadzał.

## Przykłady wnioskowania nastroju
- „Dziś totalnie dałem radę na egzaminie, jestem przeszczęśliwy!" → 5
- „Spokojny wieczór, poczytałem, nic szczególnego." → 3
- „Kolejny ciężki dzień, wszystko mnie przytłacza." → 2
- „Pokłóciłem się ze wszystkimi, czuję się okropnie." → 1
- „Miły obiad ze znajomymi, dobry humor." → 4
