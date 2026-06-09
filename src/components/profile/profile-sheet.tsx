"use client";

import { Bell, Camera, ChevronRight, Cloud, Lock, LogIn, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AccountSheet } from "@/components/profile/account-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUserStore } from "@/lib/store/user";

const SETTINGS = [
  { icon: Bell, label: "Przypomnienia" },
  { icon: Cloud, label: "Kopia w chmurze" },
  { icon: Lock, label: "PIN / Face ID" },
];

export function ProfileSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const user = useUserStore((s) => s.user);
  const setName = useUserStore((s) => s.setName);
  const setAvatarFile = useUserStore((s) => s.setAvatarFile);
  const removeAvatar = useUserStore((s) => s.removeAvatar);
  const fileRef = useRef<HTMLInputElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);

  // Synchronizacja pola z profilem po załadowaniu (wzorzec setState-w-renderze).
  const [name, setLocalName] = useState(user.name);
  const [syncedName, setSyncedName] = useState(user.name);
  if (user.name !== syncedName) {
    setSyncedName(user.name);
    setLocalName(user.name);
  }

  const initials = (user.name || "?").trim().slice(0, 2).toUpperCase();

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed === user.name) return;
    try {
      await setName(trimmed);
    } catch {
      toast.error("Nie udało się zapisać imienia");
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Wybierz plik graficzny");
      e.target.value = "";
      return;
    }
    try {
      await setAvatarFile(file);
      toast.success("Zdjęcie zaktualizowane");
    } catch {
      toast.error("Nie udało się wgrać zdjęcia");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[85vh] max-w-md rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Profil</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative rounded-full"
            aria-label="Zmień zdjęcie profilowe"
          >
            <Avatar className="size-24">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-primary/15 text-2xl font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Camera className="size-4" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="size-4" />
              Zmień zdjęcie
            </Button>
            {user.avatarUrl && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground"
                onClick={async () => {
                  try {
                    await removeAvatar();
                    toast.success("Zdjęcie usunięte");
                  } catch {
                    toast.error("Nie udało się usunąć zdjęcia");
                  }
                }}
              >
                <Trash2 className="size-4" />
                Usuń
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 px-4">
          <label htmlFor="profile-name" className="text-xs text-muted-foreground">
            Imię
          </label>
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={saveName}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1 px-4 pb-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ustawienia
          </p>
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted"
          >
            <LogIn className="size-5 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Logowanie i konto</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
          {SETTINGS.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => toast(`${label} — wkrótce`)}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted"
            >
              <Icon className="size-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />
      </SheetContent>
    </Sheet>
  );
}
