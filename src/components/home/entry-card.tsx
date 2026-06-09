"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTime } from "@/lib/date";
import { getMood } from "@/lib/moods";
import { useEntriesStore } from "@/lib/store/entries";
import { useUiStore } from "@/lib/store/ui";
import type { Entry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EntryCard({ entry }: { entry: Entry }) {
  const mood = getMood(entry.mood);
  const removeEntry = useEntriesStore((s) => s.removeEntry);
  const openEditEntry = useUiStore((s) => s.openEditEntry);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex gap-3 rounded-2xl bg-card p-3 shadow-sm">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-2xl",
            mood.ringClass,
          )}
          aria-hidden
        >
          {mood.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold">{mood.label}</span>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="-mr-1 -mt-1 rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Opcje wpisu"
              >
                <MoreHorizontal className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditEntry(entry.id)}>
                  <Pencil className="size-4" />
                  Edytuj
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Usuń
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {entry.contentText ? (
            <p className="mt-0.5 line-clamp-2 break-words text-sm text-muted-foreground">
              {entry.contentText}
            </p>
          ) : (
            <p className="mt-0.5 text-sm italic text-muted-foreground/70">Bez treści</p>
          )}
          <span className="mt-1 block text-xs text-muted-foreground">
            {formatTime(entry.createdAt)}
          </span>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunąć wpis?</AlertDialogTitle>
            <AlertDialogDescription>
              Tej operacji nie można cofnąć. Wpis zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await removeEntry(entry.id);
                  toast.success("Wpis usunięty");
                } catch {
                  toast.error("Nie udało się usunąć wpisu");
                }
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
