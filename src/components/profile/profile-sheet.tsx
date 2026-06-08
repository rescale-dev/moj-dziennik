"use client";

import { Bell, Camera, ChevronRight, Cloud, LogIn, Lock, Trash2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
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
  { icon: LogIn, label: "Logowanie i konto" },
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
  const setAvatar = useUserStore((s) => s.setAvatar);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = user.name.trim().slice(0, 2).toUpperCase();

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Wybierz plik graficzny");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      toast.success("Zdjęcie zaktualizowane");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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
                onClick={() => {
                  setAvatar(undefined);
                  toast.success("Zdjęcie usunięte");
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
            value={user.name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-1 px-4 pb-2">
          <p className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ustawienia
          </p>
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
      </SheetContent>
    </Sheet>
  );
}
