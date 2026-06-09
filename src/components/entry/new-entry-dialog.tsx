"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFullDate, parseKey } from "@/lib/date";
import { useEntry } from "@/lib/hooks";
import { useEntriesStore } from "@/lib/store/entries";
import { useUiStore } from "@/lib/store/ui";
import { computeStreak, reachedMilestone } from "@/lib/streak";
import type { Mood } from "@/lib/types";
import { MoodPicker } from "./mood-picker";
import { type EditorChange, RichTextEditor } from "./rich-text-editor";

export function NewEntryDialog() {
  const open = useUiStore((s) => s.entryDialogOpen);
  const editingId = useUiStore((s) => s.editingEntryId);
  const close = useUiStore((s) => s.closeEntryDialog);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90vh] gap-5 overflow-y-auto rounded-3xl sm:max-w-md">
        {open && <EntryForm key={editingId ?? "new"} editingId={editingId} onDone={close} />}
      </DialogContent>
    </Dialog>
  );
}

function EntryForm({
  editingId,
  onDone,
}: {
  editingId: string | null;
  onDone: () => void;
}) {
  const activeDate = useUiStore((s) => s.activeDate);
  const editing = useEntry(editingId);
  const addEntry = useEntriesStore((s) => s.addEntry);
  const updateEntry = useEntriesStore((s) => s.updateEntry);

  const [mood, setMood] = useState<Mood | null>(editing?.mood ?? null);
  const draft = useRef<EditorChange>({
    json: editing?.contentJSON ?? { type: "doc", content: [] },
    text: editing?.contentText ?? "",
  });

  const targetDate = editing ? editing.date : activeDate;

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!mood) {
      toast.error("Wybierz nastrój");
      return;
    }
    const text = draft.current.text.trim();
    const hasContent = text.length > 0;
    const contentJSON = hasContent ? draft.current.json : null;

    setSaving(true);
    try {
      if (editing) {
        await updateEntry(editing.id, { mood, contentJSON, contentText: text });
        toast.success("Zapisano zmiany");
      } else {
        await addEntry({ date: targetDate, mood, contentJSON, contentText: text });
        const dates = useEntriesStore.getState().entries.map((e) => e.date);
        const milestone = reachedMilestone(computeStreak(dates).current);
        toast.success(
          milestone ? `🔥 ${milestone} dni z rzędu! Tak trzymaj!` : "Wpis zapisany",
        );
      }
      onDone();
    } catch {
      toast.error("Nie udało się zapisać. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edytuj wpis" : "Nowy wpis"}</DialogTitle>
        <DialogDescription>{formatFullDate(parseKey(targetDate))}</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Nastrój
        </p>
        <MoodPicker value={mood} onChange={setMood} />
      </div>

      <RichTextEditor
        initialContent={editing?.contentJSON ?? null}
        onChange={(change) => {
          draft.current = change;
        }}
      />

      <DialogFooter className="gap-2 sm:gap-2">
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={onDone}
          disabled={saving}
        >
          Anuluj
        </Button>
        <Button className="rounded-full" onClick={handleSave} disabled={saving}>
          {saving ? "Zapisywanie…" : "Zapisz"}
        </Button>
      </DialogFooter>
    </>
  );
}
