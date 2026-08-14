import "server-only";

export function isInternationalCheckoutLive() {
  return process.env.INTERNATIONAL_CHECKOUT_ENABLED === "true";
}

export function getInternationalPaymentProvider() {
  return process.env.INTERNATIONAL_PAYMENT_PROVIDER?.trim() || "International checkout";
}
