import { GoogleGenAI } from "@google/genai";
import type { Mood } from "../types";

const MODEL = "gemini-2.5-flash";

const MOOD_PROMPT = `Oceń nastrój autora poniższego wpisu dziennika w skali 1–5:
1 = Bardzo źle (smutek, kryzys, rozpacz)
2 = Źle (przygnębienie, stres, zmęczenie)
3 = Neutralnie (zwyczajnie, spokojnie)
4 = Dobrze (zadowolenie, satysfakcja)
5 = Super ekstra (radość, ekscytacja, świetny dzień)
Trzymaj się tonu wypowiedzi, nie dramatyzuj ani nie zaniżaj.
Odpowiedz WYŁĄCZNIE jedną cyfrą 1–5, bez żadnego innego tekstu.`;

function clampMood(n: number): Mood {
  const r = Math.round(n);
  if (r <= 1) return 1;
  if (r >= 5) return 5;
  return r as Mood;
}

/**
 * Wnioskuje nastrój (1–5) z treści wpisu przez Gemini. Przy nietypowej
 * odpowiedzi lub braku klucza zwraca 3 (neutralnie) jako bezpieczny fallback.
 */
export async function inferMood(text: string): Promise<Mood> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !text.trim()) return 3;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `${MOOD_PROMPT}\n\nWpis:\n${text}`;

  // Retry przy przejściowych błędach Gemini (503/429/500) — inaczej blip = błędny fallback.
  const maxAttempts = 4;
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      const match = (response.text ?? "").match(/[1-5]/);
      return match ? clampMood(Number(match[0])) : 3;
    } catch (e) {
      const status = (e as { status?: number })?.status;
      const transient = status === 503 || status === 429 || status === 500;
      if (!transient || attempt >= maxAttempts) {
        console.error("[inferMood] error:", (e as Error)?.message);
        return 3;
      }
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
}
