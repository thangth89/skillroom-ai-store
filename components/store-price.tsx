import { formatUsdCents, formatVnd } from "@/lib/format";
import type { StoreLocale } from "@/lib/locale";
import { getStorefrontPricing } from "@/lib/pricing";
import type { SkillProduct } from "@/lib/types";

function formatAmount(value: number, locale: StoreLocale) {
  return locale === "vi" ? formatVnd(value) : formatUsdCents(value);
}

export function StorePrice({
  skill,
  locale,
  variant = "default",
}: {
  skill: SkillProduct;
  locale: StoreLocale;
  variant?: "card" | "detail" | "summary" | "default";
}) {
  const vi = locale === "vi";
  const pricing = getStorefrontPricing(skill, locale);

  if (skill.isFree) {
    return (
      <span className={`store-price ${variant}`}>
        <strong className="free-price">{vi ? "Miễn phí" : "Free"}</strong>
      </span>
    );
  }

  if (pricing.basePrice == null || pricing.salePrice == null) {
    return (
      <span className={`store-price ${variant}`}>
        <strong>{vi ? "Sắp ra mắt" : "Coming soon"}</strong>
      </span>
    );
  }

  return (
    <span className={`store-price ${variant}${pricing.hasDiscount ? " discounted" : ""}`}>
      {pricing.hasDiscount ? (
        <>
          <span className="discount-badge">-{pricing.discountPercent}%</span>
          <del>{formatAmount(pricing.basePrice, locale)}</del>
        </>
      ) : null}
      <strong>{formatAmount(pricing.salePrice, locale)}</strong>
    </span>
  );
}
