import { Fragment } from "react";
import { cn } from "@/lib/utils";

/** Renderuje tekst: `kod` → inline-code, **tekst** → pogrubienie. */
function withInlineCode(children: React.ReactNode): React.ReactNode {
  if (typeof children !== "string") return children;
  return children.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Method = "GET" | "POST" | "PUT" | "DELETE";

const METHOD_STYLES: Record<Method, string> = {
  GET: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  POST: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  PUT: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  DELETE: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export function MethodBadge({ method }: { method: Method }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold",
        METHOD_STYLES[method],
      )}
    >
      {method}
    </span>
  );
}

/** Nagłówek endpointu: metoda + ścieżka. */
export function EndpointHeader({ method, path }: { method: Method; path: string }) {
  return (
    <div className="mt-2 mb-6 flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
      <MethodBadge method={method} />
      <code className="font-mono text-sm break-all text-foreground">{path}</code>
    </div>
  );
}

export function DocH1({ children }: { children: React.ReactNode }) {
  return <h1 className="scroll-mt-20 text-3xl font-bold tracking-tight">{children}</h1>;
}

export function DocH2({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-10 mb-3 scroll-mt-20 text-xl font-semibold tracking-tight">
      {children}
    </h2>
  );
}

export function DocLead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
      {withInlineCode(children)}
    </p>
  );
}

export function DocP({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-foreground/90">{withInlineCode(children)}</p>;
}

/** Lista uwag — pozycje jako stringi z opcjonalnym inline-code w grawisach. */
export function DocList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-1 text-sm text-foreground/80">
      {items.map((item) => (
        <li key={item} className="list-inside list-disc">
          {withInlineCode(item)}
        </li>
      ))}
    </ul>
  );
}

export type Param = {
  name: string;
  type: string;
  required?: boolean;
  desc: React.ReactNode;
};

/** Tabela parametrów (body / query). */
export function ParamsTable({ params }: { params: Param[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Pole</th>
            <th className="px-4 py-2 font-medium">Typ</th>
            <th className="px-4 py-2 font-medium">Opis</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-t align-top">
              <td className="px-4 py-2.5">
                <code className="font-mono text-[13px] text-foreground">{p.name}</code>
                {p.required ? (
                  <span className="ml-1.5 text-[11px] font-medium text-red-500">wymagane</span>
                ) : (
                  <span className="ml-1.5 text-[11px] text-muted-foreground">opcjonalne</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <code className="font-mono text-[13px] text-muted-foreground">{p.type}</code>
              </td>
              <td className="px-4 py-2.5 text-foreground/80">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
