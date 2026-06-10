import { CodeBlock } from "@/components/docs/code-block";
import { DocH1, DocH2, DocLead, DocList, DocP } from "@/components/docs/doc-ui";

export default function McpOverviewPage() {
  return (
    <article>
      <DocH1>MCP — połączenie</DocH1>
      <DocLead>
        „Mój Dziennik” udostępnia serwer MCP (Model Context Protocol), dzięki któremu agenci AI
        (Claude, Cursor i inni) mogą korzystać z Twojego dziennika jako natywnych narzędzi — bez
        ręcznego sklejania zapytań HTTP.
      </DocLead>

      <DocH2 id="endpoint">Endpoint</DocH2>
      <DocP>Serwer działa w trybie **Remote HTTP MCP** (transport Streamable HTTP):</DocP>
      <CodeBlock language="text" code={`https://moj-dziennik-delta.vercel.app/api/mcp`} />

      <DocH2 id="autoryzacja">Autoryzacja</DocH2>
      <DocP>
        Połączenie wymaga długożyciowego tokena API w nagłówku `Authorization`. Token wygenerujesz
        przyciskiem **„Token API”** na górnym pasku tej dokumentacji (musisz być zalogowany w aplikacji).
      </DocP>
      <CodeBlock language="http" code={`Authorization: Bearer mojd_xxxxxxxxxxxxxxxxxxxxxxxx`} />
      <DocP>
        Token wskazuje użytkownika — serwer operuje wyłącznie na Twoich danych. Bez tokena połączenie
        zwraca `401`.
      </DocP>

      <DocH2 id="narzedzia">Dostępne narzędzia</DocH2>
      <DocList
        items={[
          "`add_journal_entry` — dodaje wpis (domyślnie dziś; mood opcjonalny → AI).",
          "`read_journal_day` — zwraca wpisy z konkretnego dnia.",
          "`ask_journal_agent` — pytanie do agenta z kontekstem dnia i historią.",
        ]}
      />
      <DocP>Szczegóły parametrów: zobacz „Narzędzia (tools)” w menu po lewej.</DocP>

      <DocH2 id="szybki-test">Szybki test (SDK)</DocH2>
      <DocP>Minimalny klient w Node, który listuje narzędzia i czyta dzisiejsze wpisy:</DocP>
      <CodeBlock
        language="javascript"
        code={`import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const transport = new StreamableHTTPClientTransport(
  new URL("https://moj-dziennik-delta.vercel.app/api/mcp"),
  { requestInit: { headers: { Authorization: "Bearer mojd_xxx" } } },
);
const client = new Client({ name: "demo", version: "1.0.0" });
await client.connect(transport);

console.log((await client.listTools()).tools.map((t) => t.name));
await client.callTool({ name: "add_journal_entry", arguments: { text: "Cześć z MCP!" } });`}
      />
    </article>
  );
}
