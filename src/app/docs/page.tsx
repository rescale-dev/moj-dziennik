import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { DocH1, DocH2, DocLead, DocList, DocP } from "@/components/docs/doc-ui";

export default function DocsOverviewPage() {
  return (
    <article>
      <DocH1>Dokumentacja API</DocH1>
      <DocLead>
        REST API „Mój Dziennik” pozwala sterować aplikacją programowo: dodawać wpisy, rozmawiać
        z agentem AI i odczytywać wpisy z konkretnego dnia. Każde żądanie działa w kontekście
        jednego użytkownika i wymaga tokena.
      </DocLead>

      <DocH2 id="bazowy-url">Bazowy URL</DocH2>
      <DocP>Wszystkie endpointy są dostępne pod prefiksem `/api/v1`.</DocP>
      <CodeBlock language="text" code={`https://moj-dziennik-delta.vercel.app/api/v1`} />
      <DocP>Lokalnie podczas developmentu: `http://localhost:3000/api/v1`.</DocP>

      <DocH2 id="autoryzacja">Autoryzacja</DocH2>
      <DocP>
        Uwierzytelnianie odbywa się długożyciowym tokenem API przekazywanym w nagłówku
        `Authorization`. Token jednoznacznie wskazuje użytkownika — dane innych użytkowników są
        niedostępne.
      </DocP>
      <CodeBlock language="http" code={`Authorization: Bearer mojd_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`} />
      <DocP>
        Token przechowujemy wyłącznie jako skrót SHA-256 — wartości jawnej nie da się odzyskać.
        Brakujący lub nieprawidłowy token zwraca `401 Unauthorized`.
      </DocP>

      <DocH2 id="token">Jak uzyskać token</DocH2>
      <DocP>
        Najprościej: kliknij **„Token API”** na górnym pasku tej dokumentacji (musisz być zalogowany
        w aplikacji) i skopiuj wygenerowany token. Pokazujemy go tylko raz — w bazie trzymamy wyłącznie
        jego skrót.
      </DocP>
      <DocP>
        Token jest przypisany do Twojego konta. Aby go unieważnić, ustaw `revoked = true` w tabeli
        `api_tokens`.
      </DocP>
      <DocP>
        Alternatywnie, do automatyzacji po stronie serwera, możesz wygenerować token z CLI (wymaga
        `SUPABASE_SECRET_KEY`):
      </DocP>
      <CodeBlock language="bash" code={`node scripts/issue-api-token.mjs <user_id> "etykieta"`} />

      <DocH2 id="format-bledow">Format błędów</DocH2>
      <DocP>Błędy zwracane są jako JSON z polem `error` i odpowiednim kodem HTTP.</DocP>
      <CodeBlock language="json" code={`{ "error": "Pole \`text\` jest wymagane." }`} />
      <DocList
        items={[
          "`400` — nieprawidłowe dane wejściowe",
          "`401` — brak / zły token",
          "`404` — zasób nie istnieje lub brak dostępu",
          "`500` / `502` — błąd serwera / agenta AI",
        ]}
      />

      <DocH2 id="endpointy">Endpointy</DocH2>
      <ul className="mt-4 space-y-2 text-sm">
        <li>
          <Link href="/docs/create" className="font-medium text-primary hover:underline">
            Create
          </Link>{" "}
          — dodaj nowy wpis (domyślnie na dziś, nastrój opcjonalny).
        </li>
        <li>
          <Link href="/docs/ask" className="font-medium text-primary hover:underline">
            Ask
          </Link>{" "}
          — zadaj pytanie agentowi z kontekstem wybranego dnia.
        </li>
        <li>
          <Link href="/docs/read" className="font-medium text-primary hover:underline">
            Read
          </Link>{" "}
          — pobierz wpisy z konkretnego dnia.
        </li>
      </ul>
    </article>
  );
}
