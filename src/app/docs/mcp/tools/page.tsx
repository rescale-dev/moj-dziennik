import { CodeBlock } from "@/components/docs/code-block";
import { DocH1, DocH2, DocLead, DocP, ParamsTable } from "@/components/docs/doc-ui";

export default function McpToolsPage() {
  return (
    <article>
      <DocH1>Narzędzia (tools)</DocH1>
      <DocLead>
        Serwer MCP wystawia trzy narzędzia. Wszystkie działają w kontekście użytkownika wskazanego
        przez token i odpowiadają endpointom REST API.
      </DocLead>

      <DocH2 id="add_journal_entry">add_journal_entry</DocH2>
      <DocP>Dodaje nowy wpis. Domyślnie na dziś; nastrój opcjonalny (gdy brak — wnioskowany przez AI).</DocP>
      <ParamsTable
        params={[
          { name: "text", type: "string", required: true, desc: "Treść wpisu." },
          { name: "date", type: "string (YYYY-MM-DD)", desc: "Dzień wpisu. Domyślnie dziś." },
          { name: "mood", type: "integer 1–5", desc: "Nastrój. Gdy pominięty — z treści przez AI." },
        ]}
      />
      <CodeBlock
        language="json"
        code={`{ "name": "add_journal_entry",
  "arguments": { "text": "Świetny dzień!", "mood": 5 } }`}
      />

      <DocH2 id="read_journal_day">read_journal_day</DocH2>
      <DocP>Zwraca wpisy z konkretnego dnia (może być wiele).</DocP>
      <ParamsTable
        params={[
          { name: "date", type: "string (YYYY-MM-DD)", desc: "Dzień. Domyślnie dziś (Europe/Warsaw)." },
        ]}
      />
      <CodeBlock
        language="json"
        code={`{ "name": "read_journal_day",
  "arguments": { "date": "2026-06-10" } }`}
      />

      <DocH2 id="ask_journal_agent">ask_journal_agent</DocH2>
      <DocP>
        Zadaje pytanie agentowi-przyjacielowi. Zwraca `reply` oraz `chatId` (przekaż go, aby
        kontynuować wątek). Rozmowa zapisuje się w historii czatów.
      </DocP>
      <ParamsTable
        params={[
          { name: "question", type: "string", required: true, desc: "Pytanie do agenta." },
          { name: "date", type: "string (YYYY-MM-DD)", desc: "Dzień-kontekst. Domyślnie dziś." },
          { name: "chatId", type: "string (uuid)", desc: "Id czatu do kontynuacji wątku." },
        ]}
      />
      <CodeBlock
        language="json"
        code={`{ "name": "ask_journal_agent",
  "arguments": { "question": "Jak mi dziś poszło?" } }`}
      />
    </article>
  );
}
