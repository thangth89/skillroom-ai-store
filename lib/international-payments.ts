import "server-only";

import { hasPayPalConfig } from "@/lib/paypal";

export function isInternationalCheckoutLive() {
  return hasPayPalConfig();
}

export function getInternationalPaymentProvider() {
  return hasPayPalConfig() ? "PayPal" : "International checkout";
}
