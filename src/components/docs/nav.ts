export type NavItem = { href: string; label: string };
export type NavGroup = { label: string; items: NavItem[] };
export type TabKey = "api" | "mcp";

export type DocTab = {
  key: TabKey;
  label: string;
  /** Strona startowa zakładki (klik w zakładkę prowadzi tutaj). */
  href: string;
  groups: NavGroup[];
};

export const DOC_TABS: DocTab[] = [
  {
    key: "api",
    label: "API",
    href: "/docs",
    groups: [
      { label: "Wprowadzenie", items: [{ href: "/docs", label: "Przegląd i autoryzacja" }] },
      {
        label: "Endpointy",
        items: [
          { href: "/docs/create", label: "Create — dodaj wpis" },
          { href: "/docs/ask", label: "Ask — zapytaj agenta" },
          { href: "/docs/read", label: "Read — odczytaj dzień" },
        ],
      },
    ],
  },
  {
    key: "mcp",
    label: "MCP",
    href: "/docs/mcp",
    groups: [
      { label: "Wprowadzenie", items: [{ href: "/docs/mcp", label: "Połączenie" }] },
      {
        label: "MCP",
        items: [
          { href: "/docs/mcp/tools", label: "Narzędzia (tools)" },
          { href: "/docs/mcp/clients", label: "Konfiguracja klientów" },
        ],
      },
    ],
  },
];

/** Wybiera aktywną zakładkę na podstawie ścieżki. */
export function activeTab(pathname: string): TabKey {
  return pathname.startsWith("/docs/mcp") ? "mcp" : "api";
}
