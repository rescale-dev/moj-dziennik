import { warsawHour } from "@/lib/date";

export const dynamic = "force-dynamic";

/**
 * Zwraca aktualną godzinę w Polsce. Źródłem prawdy jest zewnętrzne API
 * (timeapi.io, Europe/Warsaw); przy błędzie/timeoutcie liczymy lokalnie
 * przez Intl, więc powitanie nigdy się nie wysypie.
 */
export async function GET() {
  let hour = warsawHour();
  try {
    const res = await fetch(
      "https://timeapi.io/api/Time/current/zone?timeZone=Europe/Warsaw",
      { cache: "no-store", signal: AbortSignal.timeout(4000) },
    );
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.hour === "number") hour = data.hour;
    }
  } catch {
    // zostaje fallback z warsawHour()
  }
  return Response.json({ hour });
}
