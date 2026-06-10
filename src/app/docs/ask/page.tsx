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

export default function DocsAskPage() {
  return (
    <article>
      <DocH1>Ask — zapytaj agenta</DocH1>
      <DocLead>
        Zadaje pytanie agentowi AI („przyjacielowi” z dziennika). Agent zna wpisy z wybranego dnia
        i może sięgać po wpisy z innych dni. Rozmowa jest zapisywana w historii czatów — przekaż
        `chatId`, aby kontynuować wątek.
      </DocLead>

      <EndpointHeader method="POST" path="/api/v1/ask" />

      <DocH2 id="body">Parametry (JSON body)</DocH2>
      <ParamsTable
        params={[
          { name: "question", type: "string", required: true, desc: "Pytanie do agenta." },
          {
            name: "date",
            type: "string (YYYY-MM-DD)",
            desc: "Dzień będący kontekstem rozmowy. Domyślnie dziś (Europe/Warsaw).",
          },
          {
            name: "chatId",
            type: "string (uuid)",
            desc: "Id istniejącego czatu, aby kontynuować rozmowę. Gdy pominięty — tworzony jest nowy czat.",
          },
        ]}
      />

      <DocH2 id="przyklad">Przykład żądania</DocH2>
      <CodeBlock
        language="bash"
        code={`curl -X POST https://moj-dziennik.vercel.app/api/v1/ask \\
  -H "Authorization: Bearer mojd_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "Jak mi dziś poszło?",
    "date": "2026-06-10"
  }'`}
      />

      <DocH2 id="odpowiedz">Odpowiedź</DocH2>
      <DocP>
        `200 OK` — `reply` to odpowiedź agenta, a `chatId` identyfikuje wątek (użyj go w kolejnym
        żądaniu, aby zachować kontekst rozmowy).
      </DocP>
      <CodeBlock
        language="json"
        code={`{
  "chatId": "b3f1c2a8-7d4e-4a91-9c2f-1e5a6b7c8d90",
  "reply": "Z dzisiejszego wpisu widać sporo radości — zdany egzamin! Gratulacje. Co teraz?"
}`}
      />

      <DocH2 id="kontynuacja">Kontynuacja rozmowy</DocH2>
      <CodeBlock
        language="bash"
        code={`curl -X POST https://moj-dziennik.vercel.app/api/v1/ask \\
  -H "Authorization: Bearer mojd_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "A jak wyglądał cały tydzień?",
    "chatId": "b3f1c2a8-7d4e-4a91-9c2f-1e5a6b7c8d90"
  }'`}
      />

      <DocH2 id="uwagi">Uwagi</DocH2>
      <DocList
        items={[
          "Pytanie i odpowiedź trafiają do historii czatów (widocznej także w aplikacji).",
          "`chatId` wskazujący cudzy lub nieistniejący czat → `404`.",
          "Problem po stronie modelu AI → `502`.",
        ]}
      />
    </article>
  );
}
