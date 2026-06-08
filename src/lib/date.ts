import {
  addDays,
  format,
  isToday as dfIsToday,
  parseISO,
  startOfWeek,
} from "date-fns";
import { pl } from "date-fns/locale";

/** Klucz dnia w formacie YYYY-MM-DD (lokalny). */
export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parsuje klucz YYYY-MM-DD na Date (lokalna północ). */
export function parseKey(key: string): Date {
  return parseISO(key);
}

export function todayKey(): string {
  return dateKey(new Date());
}

/** 7 dni (Pon–Nd) tygodnia zawierającego podaną datę. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1, locale: pl });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Krótkie etykiety dni tygodnia (Pon–Nd). */
export const WEEKDAY_SHORT = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Np. „Poniedziałek, 1 czerwca 2026". */
export function formatFullDate(date: Date): string {
  return capitalize(format(date, "EEEE, d MMMM yyyy", { locale: pl }));
}

/** Np. „Niedziela, 8 czerwca". */
export function formatHeaderDate(date: Date): string {
  return capitalize(format(date, "EEEE, d MMMM", { locale: pl }));
}

/** Godzina „HH:mm". */
export function formatTime(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

export function isToday(date: Date): boolean {
  return dfIsToday(date);
}

/** Polska odmiana słowa „dzień" dla liczby. */
export function dayWord(n: number): string {
  return n === 1 ? "dzień" : "dni";
}

/** Aktualna godzina w Polsce (Europe/Warsaw), niezależnie od strefy urządzenia. */
export function warsawHour(date = new Date()): number {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    hour: "2-digit",
    hour12: false,
  }).format(date);
  return parseInt(s, 10) % 24;
}

/** Powitanie zależne od pory dnia. */
export function greetingForHour(hour: number): string {
  if (hour < 5) return "Dobrej nocy";
  if (hour < 12) return "Miłego poranka";
  if (hour < 18) return "Dzień dobry";
  return "Dobry wieczór";
}
