import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckoutForm } from "@/components/checkout-form";
import { formatUsdCents } from "@/lib/format";
import { getCatalogSkill } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getCatalogSkill(slug);
  if (!skill) notFound();
  return (
    <><SiteHeader /><main className="checkout-page shell">
      <div className="checkout-main">
        <Link className="back-link" href={`/skills/${skill.slug}`}>← Back to Skill details</Link>
        <span className="section-index">{skill.isFree ? "FREE SKILL DELIVERY" : "SECURE CHECKOUT"}</span>
        <h1>{skill.isFree ? "Get your free Skill." : "Complete your purchase."}</h1>
        <p>
          {skill.isFree
            ? "Enter an email address you can access. We will send a private download link directly to your inbox."
            : "Enter the email that should receive your Skill. International payment will open in a secure hosted checkout once Lemon Squeezy is connected."}
        </p>
        <CheckoutForm isFree={skill.isFree} slug={skill.slug} />
      </div>
      <aside className="order-summary">
        <span>{skill.isFree ? "FREE DOWNLOAD" : "ORDER SUMMARY"}</span>
        <div className="summary-preview" style={{ "--accent": skill.accent, "--accent-soft": skill.accentSoft } as React.CSSProperties}><small>{skill.category}</small><strong>{skill.name}</strong><em>{skill.version}</em></div>
        <div className="summary-line"><span>Skill price</span><strong>{skill.isFree ? "Free" : skill.priceUsdCents === null ? "Coming soon" : formatUsdCents(skill.priceUsdCents)}</strong></div>
        <div className="summary-line"><span>Delivery</span><strong>Free</strong></div>
        <div className="summary-total"><span>{skill.isFree ? "Amount due" : "Checkout total"}</span><strong>{skill.isFree ? "$0" : skill.priceUsdCents === null ? "—" : formatUsdCents(skill.priceUsdCents)}</strong></div>
        <p>Digital product. No physical shipment.</p>
      </aside>
    </main><SiteFooter /></>
  );
}
