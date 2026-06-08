# PRD — „Mój Dziennik" (dziennik nastrojów i wpisów)

| | |
|---|---|
| **Produkt** | Mój Dziennik — aplikacja do zapisywania emocji i wpisów dziennych |
| **Wersja dokumentu** | 1.0 |
| **Data** | 2026-06-08 |
| **Etap** | MVP |
| **Platforma** | Web (Next.js + shadcn/ui + Tiptap), z architekturą przygotowaną pod późniejszą wersję mobilną |
| **Status backendu** | Logowanie i AI jako placeholdery; dane przechowywane lokalnie |

---

## 1. Wprowadzenie

### 1.1. Cel produktu
Mój Dziennik to lekka aplikacja typu dziennik/pamiętnik, która pozwala użytkownikowi w prosty sposób zapisywać swoje **emocje i wpisy przypisane do konkretnego dnia**. Głównym celem jest budowanie regularnego nawyku autorefleksji — dlatego produkt mocno opiera się na **gamifikacji (streak/seria)**: im dłużej użytkownik dodaje wpisy każdego dnia, tym dłuższa seria, którą chce utrzymać.

### 1.2. Problem
Ludzie chcą śledzić swoje samopoczucie i wracać do tego, co się działo w danym dniu, ale klasyczne pamiętniki są żmudne i łatwo o nich zapomnieć. Brakuje pozytywnego bodźca, który motywuje do codziennego powrotu.

### 1.3. Rozwiązanie
Minimalistyczny, przyjemny wizualnie ekran główny, na którym w 2–3 sekundy widać: kto korzysta, jaki jest dzień, jaką ma serię i co już dziś zapisał. Dodanie wpisu zajmuje kilka kliknięć (wybór nastroju + krótka treść). Seria i kamienie milowe nagradzają regularność.

---

## 2. Grupa docelowa

- **Persona główna — „Regularny refleksyjny":** osoba (18–40 lat), która chce śledzić nastrój, redukować stres i budować nawyk codziennego zapisu. Ceni prostotę i estetykę.
- **Persona poboczna — „Okazjonalny zapisujący":** notuje wyjątkowe dni/wydarzenia; gamifikacja ma go zachęcić do częstszego korzystania.

---

## 3. Zakres MVP

### 3.1. W zakresie (In scope)
- Ekran główny z przywitaniem, datą, awatarem.
- Pasek dni tygodnia (week strip) + ikona kalendarza do wyboru dowolnego dnia/tygodnia/miesiąca/roku.
- Baner serii (streak) z gamifikacją.
- Lista wpisów wybranego dnia w formie kafelków.
- Dodawanie wpisu w osobnym oknie (modal): wybór nastroju w skali 1–5 + tytuł + treść (edytor Tiptap).
- Edycja i usuwanie wpisu; dodawanie wpisów wstecz.
- Przycisk „+" (FAB) w prawym dolnym rogu do dodawania wpisu.
- Symbol AI w lewym dolnym rogu — **placeholder** czatu z AI.
- Lokalne przechowywanie danych.

### 3.2. Poza zakresem (Out of scope — placeholdery lub przyszłość)
- Prawdziwe logowanie / rejestracja / konta (na MVP: placeholder, użytkownik „zalogowany").
- Realny czat z AI (na MVP: tylko wejście + ekran placeholder „wkrótce").
- Synchronizacja w chmurze, backend, multi-device.
- Powiadomienia push / dzwoneczek (ikona może być, akcja placeholder).
- Wersja mobilna natywna (planowana po MVP).
- Społeczność / znajomi / udostępnianie.

---

## 4. Stack technologiczny

- **Framework:** Next.js (App Router), React, TypeScript.
- **UI:** shadcn/ui + Tailwind CSS (komponenty: Dialog/Drawer, Button, Card, Avatar, Calendar, Tabs, Textarea/Input, Toast).
- **Edytor treści:** Tiptap (rich text dla pola wpisu — pogrubienie, listy, akapity).
- **Ikony:** lucide-react.
- **Daty:** date-fns z locale `pl`.
- **Stan + trwałość:** lekki store (np. Zustand) + zapis do `localStorage` (warstwa danych odseparowana za interfejsem repozytorium, by w przyszłości łatwo podmienić na backend i/lub React Native).
- **Motyw:** jasny/ciemny (CSS variables), akcent zielony.

> **Uwaga architektoniczna:** logika domenowa (wpisy, nastroje, liczenie streaka) ma być niezależna od warstwy UI i storage, aby przyszła wersja mobilna mogła współdzielić rdzeń. shadcn i Tiptap są webowe — w wersji RN zostaną zastąpione odpowiednikami, ale model danych i reguły pozostaną wspólne.

---

## 5. Architektura informacji i nawigacja

Główny ekran to **Home (dzień)**. Dolne sterowanie:
- **Lewy dolny róg:** przycisk AI (placeholder czatu).
- **Prawy dolny róg:** przycisk „+" (FAB) — dodawanie wpisu.

> Dodatkowe sekcje (Statystyki, Ustawienia, Profil) są planowane, ale w MVP mogą być placeholderami. Dolny pasek nawigacji w stylu referencji (Home · AI · Statystyki · Ustawienia) jest opcjonalny — priorytet MVP to Home + dodawanie wpisu.

---

## 6. Funkcjonalności szczegółowe

### 6.1. Logowanie (placeholder)
- Domyślnie użytkownik jest „zalogowany" (mockowany profil: imię + awatar).
- Brak realnego flow auth w MVP; przygotować punkt zaczepienia (interfejs `AuthProvider`) pod przyszłą integrację.

### 6.2. Ekran główny (Home)
Układ z góry na dół (zgodnie z referencjami):

1. **Nagłówek przywitania** — np. „Cześć, {imię}" (lub zależnie od pory dnia: „Dzień dobry/Dobry wieczór, {imię}").
2. **Data + awatar** — aktualnie wybrana data po lewej, profilowe (awatar) po prawej. Obok daty strzałki/nawigator „◀ Dziś ▶" do przeskakiwania dni.
3. **Pasek dni tygodnia (week strip)** — 7 dni (Pon–Nd) z możliwością kliknięcia, by wejść w dany dzień. Każdy dzień ma wskaźnik statusu:
   - ✅ zielony/żółty ptaszek — był wpis tego dnia,
   - 🔥 płomień — dzień w ramach aktywnej serii,
   - pusto/wyszarzone — brak wpisu.
   - Obok paska **ikona kalendarza** otwierająca pełny kalendarz (wybór dowolnego dnia, przełączanie tygodni/miesięcy/lat).
4. **Baner serii (streak)** — wyróżniona karta z gamifikacją:
   - duża liczba dni serii (np. „6 dni"),
   - tekst motywujący (np. „Dodajesz wpis codziennie od tygodnia"),
   - **najdłuższa seria** (np. „Najdłuższa seria: 14 dni"),
   - wizualny pierścień postępu / płomień.
5. **„Dzisiejsze wpisy"** — lista wpisów wybranego dnia jako **kafelki**. Każdy kafelek:
   - emoji nastroju (1–5) po lewej,
   - tytuł wpisu,
   - fragment treści,
   - godzina dodania,
   - menu „•••" (edytuj / usuń).
   - Stan pusty: zachęta „Dodaj pierwszy wpis".
6. **Sterowanie dolne (floating):** AI (lewo) + „+" (prawo).

### 6.3. Dodawanie / edycja wpisu (modal „Nowy wpis")
Otwierane przyciskiem „+". Osobne okno (Dialog/Drawer):

- **Nagłówek:** „Nowy wpis" + wybrana data słownie (np. „Poniedziałek, 1 czerwca 2026").
- **Sekcja NASTRÓJ — skala 1–5** (5 buziek/ikon):
  - 1 — 😢 Bardzo źle
  - 2 — 😔 Źle
  - 3 — 😐 Neutralnie
  - 4 — 🙂 Dobrze
  - 5 — 🤩 Super ekstra
  - Zaznaczona ikona jest podświetlona (akcent zielony). Wybór nastroju jest **wymagany**.
- **Pole „Tytuł"** (krótkie, opcjonalne lub jednoliniowe — do ustalenia; domyślnie opcjonalne).
- **Pole treści „Co się dzieje?"** — edytor **Tiptap** (placeholder „Co się dzieje?", podstawowe formatowanie).
- **Akcje:** „Anuluj" / „Zapisz".
- Po zapisie: wpis pojawia się na liście dnia, aktualizuje się streak, ewentualny komunikat o kamieniu milowym.
- **Dodawanie wstecz:** możliwe poprzez wybór wcześniejszej daty (przez kalendarz/week strip) przed dodaniem wpisu.

### 6.4. Streak / gamifikacja
- **Zasada:** min. 1 wpis zalicza dany dzień; seria liczona z pełnej historii dat.
- **Reset:** brak wpisu w danym dniu przerywa serię (liczone wg lokalnej północy).
- **Dodawanie wstecz** uzupełnia lukę i **może odbudować serię** (decyzja domyślna; do ew. zaostrzenia później).
- **Najdłuższa seria** zapisywana i pokazywana w banerze.
- **Kamienie milowe** (np. 7 / 14 / 30 / 90 / 365 dni): komunikat + drobna animacja/odznaka.

### 6.5. Kalendarz
- Ikona obok week stripa otwiera pełny widok kalendarza.
- Nawigacja: dzień → tydzień → miesiąc → rok.
- Dni z wpisami oznaczone (kropka/ikona). Kliknięcie dnia ustawia go jako aktywny na Home.

### 6.6. AI (placeholder)
- Przycisk AI (lewy dolny róg), wizualnie wyróżniony (np. gradient + delikatna animacja).
- W MVP otwiera ekran/sheet z informacją „Czat z AI — wkrótce" (placeholder, bez realnej integracji).
- Architektura: zostawić miejsce na przyszłą integrację (np. asystent podsumowujący nastrój).

---

## 7. Model danych (MVP, lokalny)

```ts
type Mood = 1 | 2 | 3 | 4 | 5; // 1 = bardzo źle, 5 = super ekstra

type Entry = {
  id: string;
  date: string;        // YYYY-MM-DD (dzień, którego dotyczy wpis)
  createdAt: string;   // ISO timestamp (do sortowania i godziny)
  updatedAt: string;
  mood: Mood;
  title?: string;
  contentJSON: object; // dokument Tiptap (JSON)
  contentText: string; // wersja tekstowa (podgląd na kafelku, wyszukiwanie)
};

type User = {        // mock w MVP
  id: string;
  name: string;
  avatarUrl?: string;
};

type StreakState = {
  current: number;
  longest: number;
  lastEntryDate?: string; // YYYY-MM-DD
};
```

- Wiele wpisów na dzień jest dozwolone.
- Streak wyliczany z historii dat wpisów (funkcja czysta, testowalna).

---

## 8. Przepływy użytkownika (kluczowe)

1. **Dodanie dzisiejszego wpisu:** Home → „+" → wybór nastroju (1–5) → wpisanie treści → „Zapisz" → wpis na liście + aktualizacja serii.
2. **Przegląd innego dnia:** Home → klik dnia na week stripie lub ikona kalendarza → wybór daty → lista wpisów tego dnia.
3. **Dodanie wpisu wstecz:** wybór wcześniejszej daty → „+" → zapis → ew. odbudowa serii.
4. **Edycja/usunięcie:** kafelek → „•••" → edytuj/usuń.
5. **Wejście w AI (placeholder):** przycisk AI → ekran „wkrótce".

---

## 9. Wymagania niefunkcjonalne
- **Wydajność:** ekran główny i otwarcie modala < 200 ms (dane lokalne).
- **Dostępność:** kontrast, focus states, obsługa klawiatury w modalu, etykiety ARIA dla ikon nastroju.
- **Responsywność:** projekt mobile-first (layout jak na telefonie), poprawny też na desktopie.
- **Trwałość:** dane przeżywają odświeżenie strony (localStorage); brak utraty przy zwykłym użyciu.
- **i18n:** interfejs po polsku; daty z locale `pl`.

---

## 10. Wytyczne UI / design
- **Styl:** minimalistyczny, „miękki" (zaokrąglone karty, delikatne cienie), dużo światła.
- **Akcent:** zielony (seria, aktywne stany, FAB „+"); paleta bazowa neutralna.
- **AI:** odróżniony wizualnie (np. gradient).
- **Komponenty:** karty wpisów, week strip z badge'ami statusu, baner serii z pierścieniem postępu, modal nowego wpisu z siatką nastrojów.
- **Tryb ciemny:** wspierany.
- Inspiracje: załączone referencje (ekran główny z week stripem i banerem serii; modal „Nowy wpis"; przyjazny, „habit-tracker" feel).

---

## 11. Metryki sukcesu (MVP)
- **D1/D7 retencja** — czy użytkownicy wracają.
- **Średnia liczba wpisów / aktywny dzień.**
- **Odsetek użytkowników z serią ≥ 7 dni.**
- **Czas dodania wpisu** (im krótszy, tym lepiej).

---

## 12. Roadmapa (po MVP)
1. **Statystyki:** trend nastroju + częstość emocji (zakresy 7/30/90 dni / rok).
2. **Realne logowanie + synchronizacja w chmurze.**
3. **Czat z AI** (np. podsumowania nastroju, sugestie).
4. **Powiadomienia/przypomnienia** (dzwoneczek).
5. **Wersja mobilna** (React Native/Expo, współdzielony rdzeń domenowy).
6. **Załączniki** (zdjęcie do wpisu), wyszukiwanie, eksport.

---

## 13. Założenia i otwarte kwestie
- **Założenie:** w MVP profil użytkownika jest mockowany (imię + awatar), bez prawdziwego logowania.
- **Założenie:** nastrój w skali **1–5** (zgodnie z decyzją), mimo że załączona referencja modala pokazywała więcej emocji — w razie potrzeby model można rozszerzyć później.
- **Do ustalenia:** czy tytuł wpisu jest wymagany czy opcjonalny (domyślnie: opcjonalny).
- **Do ustalenia:** limit długości treści (sugestia: bez twardego limitu lub ~1000 znaków).
- **Do ustalenia:** czy w MVP pokazujemy pełny dolny pasek nawigacji, czy tylko AI + „+".
- **Do ustalenia:** twardość reguły streaka (czy wpis wstecz odbudowuje serię — domyślnie tak).
```
