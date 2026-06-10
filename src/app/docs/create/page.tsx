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

export default function DocsCreatePage() {
  return (
    <article>
      <DocH1>Create — dodaj wpis</DocH1>
      <DocLead>
        Tworzy nowy wpis dziennika dla zalogowanego użytkownika. Domyślnie zapisuje wpis na dziś
        (strefa Europe/Warsaw). Jeśli nie podasz nastroju, zostanie on wywnioskowany z treści przez AI.
      </DocLead>

      <EndpointHeader method="POST" path="/api/v1/entries" />

      <DocH2 id="body">Parametry (JSON body)</DocH2>
      <ParamsTable
        params={[
          { name: "text", type: "string", required: true, desc: "Treść wpisu." },
          {
            name: "date",
            type: "string (YYYY-MM-DD)",
            desc: "Dzień wpisu. Domyślnie dziś (Europe/Warsaw).",
          },
          {
            name: "mood",
            type: "integer 1–5",
            desc: "Nastrój. Gdy pominięty — wnioskowany z treści przez AI.",
          },
        ]}
      />

      <DocH2 id="przyklad">Przykład żądania</DocH2>
      <CodeBlock
        language="bash"
        code={`curl -X POST https://moj-dziennik.vercel.app/api/v1/entries \\
  -H "Authorization: Bearer mojd_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Świetny dzień — zdałem egzamin!",
    "mood": 5
  }'`}
      />

      <DocH2 id="odpowiedz">Odpowiedź</DocH2>
      <DocP>`201 Created` — zwraca utworzony wpis w polu `entry`.</DocP>
      <CodeBlock
        language="json"
        code={`{
  "entry": {
    "id": "0569432e-1b9b-4b89-b929-c935c86e23d4",
    "date": "2026-06-10",
    "mood": 5,
    "content_text": "Świetny dzień — zdałem egzamin!",
    "content_json": { "type": "doc", "content": [/* … */] },
    "created_at": "2026-06-10T15:54:14.142Z",
    "updated_at": "2026-06-10T15:54:14.142Z"
  }
}`}
      />

      <DocH2 id="uwagi">Uwagi</DocH2>
      <DocList
        items={[
          "Skala nastroju: 1 = Bardzo źle, 3 = Neutralnie, 5 = Super ekstra.",
          "W danym dniu może istnieć wiele wpisów — każde żądanie tworzy nowy.",
          "`mood` poza zakresem 1–5 lub zły format `date` → `400`.",
        ]}
      />
    </article>
  );
}
