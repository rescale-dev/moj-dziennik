import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { isPaidAgent } from "@/lib/agents";
import { parseClientReferenceId } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOLERANCE_SECONDS = 300; // ochrona przed replay (5 min)

/** Weryfikuje podpis Stripe (`Stripe-Signature: t=...,v1=...`) bez SDK. */
function verifySignature(payload: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  let t = "";
  const v1s: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") t = v;
    else if (k === "v1" && v) v1s.push(v);
  }
  if (!t || v1s.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > TOLERANCE_SECONDS) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${payload}`, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected);
  return v1s.some((v) => {
    const vBuf = Buffer.from(v);
    return vBuf.length === expectedBuf.length && crypto.timingSafeEqual(vBuf, expectedBuf);
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] brak STRIPE_WEBHOOK_SECRET");
    return Response.json({ error: "Webhook nie skonfigurowany" }, { status: 500 });
  }

  // Surowe body jest wymagane do weryfikacji podpisu.
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("stripe-signature"), secret)) {
    return Response.json({ error: "Nieprawidłowy podpis" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Nieprawidłowy payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paid = session.payment_status === "paid" || session.payment_status == null;
    const parsed = parseClientReferenceId(session.client_reference_id as string | undefined);

    if (paid && parsed && isPaidAgent(parsed.agentId)) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.SUPABASE_SECRET_KEY ?? "",
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { error } = await admin
        .from("agent_entitlements")
        .upsert(
          {
            user_id: parsed.userId,
            agent_id: parsed.agentId,
            source: "stripe",
            stripe_session_id: session.id as string,
          },
          { onConflict: "user_id,agent_id", ignoreDuplicates: true },
        );
      if (error) {
        console.error("[stripe/webhook] zapis uprawnienia nieudany:", error.message);
        return Response.json({ error: "Zapis nieudany" }, { status: 500 });
      }
      console.info(`[stripe/webhook] odblokowano ${parsed.agentId} dla ${parsed.userId}`);
    }
  }

  return Response.json({ received: true });
}
