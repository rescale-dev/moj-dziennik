import { CodeBlock } from "@/components/docs/code-block";
import { DocH1, DocH2, DocLead, DocP } from "@/components/docs/doc-ui";

export default function McpClientsPage() {
  return (
    <article>
      <DocH1>Konfiguracja klientów</DocH1>
      <DocLead>
        Podłącz serwer MCP do swojego klienta AI. Endpoint to{" "}
        `https://moj-dziennik-delta.vercel.app/api/mcp`, autoryzacja przez nagłówek `Authorization`
        z Twoim tokenem.
      </DocLead>

      <DocH2 id="cursor">Cursor</DocH2>
      <DocP>Dodaj wpis w `~/.cursor/mcp.json` (lub w ustawieniach projektu `.cursor/mcp.json`):</DocP>
      <CodeBlock
        language="json"
        code={`{
  "mcpServers": {
    "moj-dziennik": {
      "url": "https://moj-dziennik-delta.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer mojd_xxx" }
    }
  }
}`}
      />

      <DocH2 id="claude">Claude (Desktop / Code)</DocH2>
      <DocP>
        Klienci obsługujący zdalne serwery przez Streamable HTTP mogą użyć tej samej konfiguracji.
        Dla klientów wspierających tylko stdio użyj mostka `mcp-remote`:
      </DocP>
      <CodeBlock
        language="json"
        code={`{
  "mcpServers": {
    "moj-dziennik": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://moj-dziennik-delta.vercel.app/api/mcp",
        "--header", "Authorization: Bearer mojd_xxx"
      ]
    }
  }
}`}
      />

      <DocH2 id="weryfikacja">Weryfikacja</DocH2>
      <DocP>
        Po zapisaniu konfiguracji i restarcie klienta powinny pojawić się trzy narzędzia:
        `add_journal_entry`, `read_journal_day`, `ask_journal_agent`. Jeśli ich nie widać — sprawdź,
        czy token jest poprawny (połączenie bez tokena zwraca `401`).
      </DocP>
    </article>
  );
}
