export function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatUsdCents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatOrderAmount(value: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();
  if (normalizedCurrency === "VND") return formatVnd(value);
  if (normalizedCurrency === "USD") return formatUsdCents(value);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
