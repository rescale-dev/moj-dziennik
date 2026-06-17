"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, type JSONContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List } from "lucide-react";
import { DictationButton } from "@/components/dictation-button";
import { cn } from "@/lib/utils";

export type EditorChange = { json: JSONContent; text: string };

export function RichTextEditor({
  initialContent,
  placeholder = "Co się dzieje?",
  onChange,
}: {
  initialContent: JSONContent | null;
  placeholder?: string;
  onChange: (change: EditorChange) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: initialContent ?? "",
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-32 w-full max-w-full break-words focus:outline-none text-sm leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => onChange({ json: editor.getJSON(), text: editor.getText() }),
  });

  if (!editor) {
    return <div className="min-h-40 rounded-2xl border bg-card" />;
  }

  const toolBtn = (active: boolean) =>
    cn(
      "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted",
      active && "bg-muted text-foreground",
    );

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-1 border-b px-2 py-1">
        <button
          type="button"
          aria-label="Pogrubienie"
          className={toolBtn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Kursywa"
          className={toolBtn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Lista"
          className={toolBtn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <DictationButton
          className="p-1.5"
          onText={(text) => editor.chain().focus().insertContent(`${text} `).run()}
        />
      </div>
      <EditorContent
        editor={editor}
        className="max-h-60 overflow-y-auto overflow-x-hidden px-3 py-2.5"
      />
    </div>
  );
}
