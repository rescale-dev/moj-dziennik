import type { JSONContent } from "@tiptap/react";

/**
 * Buduje dokument Tiptap z czystego tekstu (akapity rozdzielone nową linią).
 * Pusty tekst → `null` (kolumna content_json jest nullable).
 */
export function textToTiptapDoc(text: string): JSONContent | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const paragraphs = trimmed.split(/\n{2,}/).map((block) => block.trim());
  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: p ? [{ type: "text", text: p }] : [],
    })),
  };
}
