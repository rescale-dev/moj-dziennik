"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
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
import { resizeFileForUpload } from "@/lib/image";
import { useEntriesStore } from "@/lib/store/entries";
import { deleteEntryPhotos, getPhotoUrl, uploadEntryPhoto } from "@/lib/supabase/storage";
import { useUiStore } from "@/lib/store/ui";
import { computeStreak, reachedMilestone } from "@/lib/streak";
import type { Mood } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
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

  const [photoPaths, setPhotoPaths] = useState<string[]>(editing?.photoPaths ?? []);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const targetDate = editing ? editing.date : activeDate;
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const handleFiles = async (files: File[]) => {
    if (!userId) { toast.error("Nie jesteś zalogowany"); return; }
    setUploading(true);
    try {
      const paths = await Promise.all(
        files.map(async (file) => {
          const compressed = await resizeFileForUpload(file);
          return uploadEntryPhoto(userId, compressed);
        }),
      );
      setPhotoPaths((prev) => [...prev, ...paths]);
    } catch {
      toast.error("Nie udało się przesłać zdjęcia");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (path: string) => {
    try {
      await deleteEntryPhotos([path]);
      setPhotoPaths((prev) => prev.filter((p) => p !== path));
    } catch {
      toast.error("Nie udało się usunąć zdjęcia");
    }
  };

  const handleSave = async () => {
    if (!mood) {
      toast.error("Wybierz nastrój");
      return;
    }
    const text = draft.current.text.trim();
    const hasContent = text.length > 0 || photoPaths.length > 0;
    if (!hasContent) {
      toast.error("Dodaj tekst lub zdjęcie");
      return;
    }
    const contentJSON = text.length > 0 ? draft.current.json : null;

    setSaving(true);
    try {
      if (editing) {
        await updateEntry(editing.id, { mood, contentJSON, contentText: text, photoPaths });
        toast.success("Zapisano zmiany");
      } else {
        await addEntry({ date: targetDate, mood, contentJSON, contentText: text, photoPaths });
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

      {photoPaths.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photoPaths.map((path) => (
            <div key={path} className="relative shrink-0">
              <img
                src={getPhotoUrl(path)}
                alt=""
                className="h-20 w-auto max-w-[50vw] rounded-xl object-cover"
              />
              <button
                type="button"
                aria-label="Usuń zdjęcie"
                onClick={() => removePhoto(path)}
                className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-background shadow-md"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(Array.from(e.target.files));
          e.target.value = "";
        }}
      />

      <RichTextEditor
        initialContent={editing?.contentJSON ?? null}
        onChange={(change) => { draft.current = change; }}
        onPhotoRequest={() => fileInputRef.current?.click()}
      />

      <DialogFooter className="gap-2 sm:gap-2">
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={onDone}
          disabled={saving || uploading}
        >
          Anuluj
        </Button>
        <Button
          className="rounded-full"
          onClick={handleSave}
          disabled={saving || uploading}
        >
          {uploading ? "Przesyłanie…" : saving ? "Zapisywanie…" : "Zapisz"}
        </Button>
      </DialogFooter>
    </>
  );
}
