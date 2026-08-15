import type { StoreLocale } from "@/lib/locale";
import type { SkillProduct } from "@/lib/types";

export function normalizeDiscountPercent(value: number | null | undefined) {
  if (!Number.isInteger(value) || value == null || value < 1 || value > 99) return 0;
  return value;
}

export function applyPercentageDiscount(price: number, discountPercent: number | null | undefined) {
  if (!Number.isFinite(price) || price <= 0) return Math.max(0, Math.round(price) || 0);

  const normalizedDiscount = normalizeDiscountPercent(discountPercent);
  if (normalizedDiscount === 0) return Math.round(price);

  return Math.max(1, Math.round((price * (100 - normalizedDiscount)) / 100));
}

export function getStorefrontPricing(skill: SkillProduct, locale: StoreLocale) {
  const basePrice = locale === "vi" ? skill.priceVnd : skill.priceUsdCents;
  const discountPercent = normalizeDiscountPercent(skill.discountPercent);
  const salePrice = basePrice == null
    ? null
    : applyPercentageDiscount(basePrice, discountPercent);

  return {
    basePrice,
    discountPercent,
    salePrice,
    hasDiscount:
      !skill.isFree &&
      basePrice != null &&
      salePrice != null &&
      discountPercent > 0 &&
      salePrice < basePrice,
  };
}
