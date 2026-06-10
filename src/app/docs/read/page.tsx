import { CodeBlock } from "@/components/docs/code-block";
import {
  DocH1,
  DocH2,
  DocLead,
  DocList,
  DocP,
  EndpointHeader,
  ParamsTable,
} from "@/components/docs/doc-ui";

export default function DocsReadPage() {
  return (
    <article>
      <DocH1>Read — odczytaj dzień</DocH1>
      <DocLead>
        Zwraca wpisy zalogowanego użytkownika z konkretnego dnia. Ponieważ w jednym dniu może być
        wiele wpisów, odpowiedź zawiera tablicę.
      </DocLead>

      <EndpointHeader method="GET" path="/api/v1/entries?date=YYYY-MM-DD" />

      <DocH2 id="query">Parametry (query string)</DocH2>
      <ParamsTable
        params={[
          {
            name: "date",
            type: "string (YYYY-MM-DD)",
            desc: "Dzień do pobrania. Domyślnie dziś (Europe/Warsaw).",
          },
        ]}
      />

      <DocH2 id="przyklad">Przykład żądania</DocH2>
      <CodeBlock
        language="bash"
        code={`curl https://moj-dziennik-delta.vercel.app/api/v1/entries?date=2026-06-10 \\
  -H "Authorization: Bearer mojd_xxx"`}
      />

      <DocH2 id="odpowiedz">Odpowiedź</DocH2>
      <DocP>`200 OK` — `date` to odpytany dzień, `entries` to lista wpisów (może być pusta).</DocP>
      <CodeBlock
        language="json"
        code={`{
  "date": "2026-06-10",
  "entries": [
    {
      "id": "0569432e-1b9b-4b89-b929-c935c86e23d4",
      "date": "2026-06-10",
      "mood": 5,
      "content_text": "Świetny dzień — zdałem egzamin!",
      "content_json": { "type": "doc", "content": [/* … */] },
      "created_at": "2026-06-10T15:54:14.142Z",
      "updated_at": "2026-06-10T15:54:14.142Z"
    }
  ]
}`}
      />

      <DocH2 id="uwagi">Uwagi</DocH2>
      <DocList
        items={[
          "Brak wpisów danego dnia → `200` z pustą tablicą `entries`.",
          "Zły format `date` → `400`.",
        ]}
      />
    </article>
  );
}
