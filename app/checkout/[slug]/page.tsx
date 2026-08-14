import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckoutForm } from "@/components/checkout-form";
import { formatUsdCents, formatVnd } from "@/lib/format";
import { getCatalogSkill } from "@/lib/catalog";
import { getInternationalPaymentProvider, isInternationalCheckoutLive } from "@/lib/international-payments";
import { getStoreLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getStoreLocale()]);
  const skill = await getCatalogSkill(slug, locale);
  if (!skill) notFound();

  const vi = locale === "vi";
  const internationalLive = isInternationalCheckoutLive();
  const providerName = getInternationalPaymentProvider();
  const price = skill.isFree
    ? (vi ? "Miễn phí" : "Free")
    : vi
      ? formatVnd(skill.priceVnd)
      : skill.priceUsdCents === null ? "Coming soon" : formatUsdCents(skill.priceUsdCents);

  return (
    <><SiteHeader /><main className="checkout-page shell">
      <div className="checkout-main">
        <Link className="back-link" href={`/skills/${skill.slug}`}>← {vi ? "Quay lại chi tiết Skill" : "Back to Skill details"}</Link>
        <span className="section-index">
          {skill.isFree ? (vi ? "GIAO SKILL MIỄN PHÍ" : "FREE SKILL DELIVERY") : vi ? "THANH TOÁN AN TOÀN" : "INTERNATIONAL CHECKOUT"}
        </span>
        <h1>{skill.isFree ? (vi ? "Nhận Skill miễn phí." : "Get your free Skill.") : vi ? "Hoàn tất đơn hàng." : "Complete your purchase."}</h1>
        <p>
          {skill.isFree
            ? vi
              ? "Nhập email bạn đang sử dụng. Chúng tôi sẽ gửi trực tiếp liên kết tải riêng tư vào hộp thư."
              : "Enter an email address you can access. We will send a private download link directly to your inbox."
            : vi
              ? "Nhập đúng email nhận Skill. Hệ thống sẽ tạo mã VietQR riêng cho đơn hàng; không thay đổi nội dung chuyển khoản."
              : internationalLive && skill.internationalCheckoutUrl
                ? `Continue to the secure ${providerName} checkout. The payment provider will collect and verify your billing details.`
                : "International payment is temporarily unavailable while we connect a new approved provider. Free Skills remain available."}
        </p>
        <CheckoutForm
          checkoutUrl={skill.internationalCheckoutUrl}
          internationalLive={internationalLive}
          isFree={skill.isFree}
          locale={locale}
          providerName={providerName}
          slug={skill.slug}
        />
      </div>
      <aside className="order-summary">
        <span>{skill.isFree ? (vi ? "TẢI MIỄN PHÍ" : "FREE DOWNLOAD") : vi ? "TÓM TẮT ĐƠN HÀNG" : "ORDER SUMMARY"}</span>
        <div className="summary-preview" style={{ "--accent": skill.accent, "--accent-soft": skill.accentSoft } as React.CSSProperties}><small>{skill.category}</small><strong>{skill.name}</strong><em>{skill.version}</em></div>
        <div className="summary-line"><span>{vi ? "Giá Skill" : "Skill price"}</span><strong>{price}</strong></div>
        <div className="summary-line"><span>{vi ? "Giao hàng" : "Delivery"}</span><strong>{vi ? "Miễn phí" : "Free"}</strong></div>
        <div className="summary-total"><span>{skill.isFree ? (vi ? "Cần thanh toán" : "Amount due") : vi ? "Tổng thanh toán" : "Checkout total"}</span><strong>{skill.isFree ? (vi ? "0 ₫" : "$0") : price}</strong></div>
        <p>{vi ? "Sản phẩm số. Không giao hàng vật lý." : "Digital product. No physical shipment."}</p>
      </aside>
    </main><SiteFooter /></>
  );
}
