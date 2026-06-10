import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { resolveApiToken } from "@/lib/server/auth";
import {
  askAgent,
  type Ctx,
  createEntry,
  getDayEntries,
  JournalError,
} from "@/lib/server/journal";
import { createAdminClient } from "@/lib/server/supabase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ToolExtra = { authInfo?: { extra?: { userId?: string } } };

/** Buduje kontekst (klient service-key + userId) z danych tokena MCP. */
function ctxFrom(extra: ToolExtra): Ctx {
  const userId = extra?.authInfo?.extra?.userId;
  if (!userId) throw new JournalError(401, "Brak autoryzacji.");
  return { admin: createAdminClient(), userId };
}

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

const fail = (err: unknown) => {
  const message = err instanceof JournalError ? err.message : "Błąd serwera.";
  if (!(err instanceof JournalError)) console.error("[MCP] tool error:", err);
  return { content: [{ type: "text" as const, text: `Błąd: ${message}` }], isError: true };
};

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "add_journal_entry",
      "Dodaje nowy wpis do dziennika użytkownika. Domyślnie na dziś (Europe/Warsaw). " +
        "Nastrój (mood) jest opcjonalny — gdy pominięty, zostanie wywnioskowany z treści przez AI.",
      {
        text: z.string().describe("Treść wpisu."),
        date: z.string().optional().describe("Dzień wpisu YYYY-MM-DD. Domyślnie dziś."),
        mood: z.number().int().min(1).max(5).optional().describe("Nastrój 1–5 (opcjonalny)."),
      },
      async (args, extra: ToolExtra) => {
        try {
          return ok({ entry: await createEntry(ctxFrom(extra), args) });
        } catch (err) {
          return fail(err);
        }
      },
    );

    server.tool(
      "read_journal_day",
      "Zwraca wpisy dziennika użytkownika z konkretnego dnia (domyślnie dziś).",
      {
        date: z.string().optional().describe("Dzień YYYY-MM-DD. Domyślnie dziś (Europe/Warsaw)."),
      },
      async (args, extra: ToolExtra) => {
        try {
          return ok(await getDayEntries(ctxFrom(extra), args.date));
        } catch (err) {
          return fail(err);
        }
      },
    );

    server.tool(
      "ask_journal_agent",
      "Zadaje pytanie agentowi-przyjacielowi z dziennika. Agent zna wpisy z wybranego dnia i może " +
        "sięgać po inne. Zwraca odpowiedź i chatId (przekaż go, aby kontynuować rozmowę).",
      {
        question: z.string().describe("Pytanie do agenta."),
        date: z.string().optional().describe("Dzień-kontekst YYYY-MM-DD. Domyślnie dziś."),
        chatId: z.string().optional().describe("Id czatu, aby kontynuować wątek."),
      },
      async (args, extra: ToolExtra) => {
        try {
          return ok(await askAgent(ctxFrom(extra), args));
        } catch (err) {
          return fail(err);
        }
      },
    );
  },
  { serverInfo: { name: "moj-dziennik", version: "1.0.0" } },
  { basePath: "/api", disableSse: true },
);

// Autoryzacja MCP: token `mojd_…` w nagłówku Authorization: Bearer.
const verifyToken = async (_req: Request, bearerToken?: string) => {
  const auth = await resolveApiToken(bearerToken);
  if (!auth) return undefined;
  return {
    token: bearerToken as string,
    clientId: auth.userId,
    scopes: [],
    extra: { userId: auth.userId },
  };
};

const authedHandler = withMcpAuth(handler, verifyToken, { required: true });

export { authedHandler as GET, authedHandler as POST, authedHandler as DELETE };
