/** Konfiguracja jednorazowej płatności za Agenta AI. */

/** Link do płatności Stripe (Payment Link). Można nadpisać przez env. */
const STRIPE_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ??
  "https://buy.stripe.com/test_4gM4gAc0F7jrcdm62L1VK00";

/** Cena wyświetlana użytkownikowi. */
export const AI_PRICE_LABEL = "5 zł";

/**
 * Zwraca link Stripe z doklejonym `client_reference_id`, dzięki czemu
 * w panelu Stripe widać, który użytkownik dokonał płatności.
 */
export function stripeCheckoutUrl(userId: string): string {
  const url = new URL(STRIPE_PAYMENT_LINK);
  if (userId) url.searchParams.set("client_reference_id", userId);
  return url.toString();
}
