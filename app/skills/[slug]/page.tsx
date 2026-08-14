import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VideoPreview } from "@/components/video-preview";
import { formatUsdCents, formatVnd } from "@/lib/format";
import { getCatalogSkill } from "@/lib/catalog";
import { getStoreLocale } from "@/lib/locale";
import { isInternationalCheckoutLive } from "@/lib/international-payments";

export const dynamic = "force-dynamic";

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, locale] = await Promise.all([params, getStoreLocale()]);
  const skill = await getCatalogSkill(slug, locale);
  if (!skill) notFound();

  const vi = locale === "vi";
  const internationalLive = isInternationalCheckoutLive();
  const price = skill.isFree
    ? vi ? "Miễn phí" : "Free"
    : vi
      ? formatVnd(skill.priceVnd)
      : skill.priceUsdCents === null ? "Coming soon" : formatUsdCents(skill.priceUsdCents);
  const checkoutAvailable = vi || skill.isFree || (internationalLive && Boolean(skill.internationalCheckoutUrl));

  return (
    <><SiteHeader /><main>
      <section className="detail-hero shell">
        <div className="detail-copy">
          <Link className="back-link" href="/skills">← {vi ? "Kho Skill" : "Skill Library"}</Link>
          <div className="card-meta"><span>{skill.category}</span><span>{skill.version}</span></div>
          <h1>{skill.name}</h1>
          <p className="detail-eyebrow">{skill.eyebrow}</p>
          <p className="detail-description">{skill.description}</p>
          <div className="detail-buy-row">
            <strong className={skill.isFree ? "free-price" : ""}>{price}</strong>
            {checkoutAvailable ? (
              <Link className="primary-button" href={`/checkout/${skill.slug}`}>
                {vi ? (skill.isFree ? "Nhận Skill miễn phí" : "Mua Skill") : (skill.isFree ? "Get this Skill free" : "Continue to checkout")} <span>→</span>
              </Link>
            ) : (
              <span className="primary-button button-disabled" aria-disabled="true">International checkout updating</span>
            )}
          </div>
          <small>
            {skill.isFree
              ? vi ? "Không cần thanh toán • Gửi bảo mật qua email" : "No payment required • Secure delivery by email"
              : vi
                ? "Thanh toán VietQR • Gửi tự động qua email"
                : checkoutAvailable
                  ? "Secure international payment • Automatic email delivery"
                  : "No payment can be made while our new international payment provider is being activated."}
          </small>
        </div>
        <VideoPreview id={`detail-${skill.slug}`} src={skill.videoSrc} label={skill.name} accent={skill.accent} accentSoft={skill.accentSoft} detail locale={locale} />
      </section>
      <section className="detail-content shell">
        <article><span className="section-index">{vi ? "KẾT QUẢ" : "OUTCOMES"}</span><h2>{vi ? "Skill giúp bạn kiểm soát điều gì?" : "What does this Skill help you control?"}</h2><ul>{skill.outcomes.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span className="section-index">{vi ? "BẠN NHẬN ĐƯỢC" : "WHAT YOU GET"}</span><h2>{vi ? "Gói bàn giao rõ ràng." : "A clear, usable delivery package."}</h2><ul>{skill.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span className="section-index">{vi ? "YÊU CẦU" : "REQUIREMENTS"}</span><h2>{vi ? "Chuẩn bị trước khi dùng." : "What to prepare before you start."}</h2><ul>{skill.requirements.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </section>
      <section className="detail-cta shell">
        <div>
          <span>{vi ? "ĐÃ XEM ĐỦ THÔNG TIN?" : "READY TO TRY THE WORKFLOW?"}</span>
          <h2>{skill.isFree ? (vi ? "Nhận Skill miễn phí ngay trong email." : "Send the free Skill straight to your inbox.") : (vi ? "Nhận Skill trong email sau khi thanh toán." : checkoutAvailable ? "Get a private download link after secure checkout." : "International checkout will return with our new payment provider.")}</h2>
        </div>
        {checkoutAvailable ? <Link className="primary-button inverse" href={`/checkout/${skill.slug}`}>{vi ? (skill.isFree ? "Nhận miễn phí" : "Tiếp tục mua") : (skill.isFree ? "Get it free" : "Continue")} <span>→</span></Link> : null}
      </section>
    </main><SiteFooter /></>
  );
}
