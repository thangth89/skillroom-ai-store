import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VideoPreview } from "@/components/video-preview";
import { formatUsdCents } from "@/lib/format";
import { getCatalogSkill } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getCatalogSkill(slug);
  if (!skill) notFound();
  return (
    <><SiteHeader /><main>
      <section className="detail-hero shell">
        <div className="detail-copy">
          <Link className="back-link" href="/skills">← Skill Library</Link>
          <div className="card-meta"><span>{skill.category}</span><span>{skill.version}</span></div>
          <h1>{skill.name}</h1>
          <p className="detail-eyebrow">{skill.eyebrow}</p>
          <p className="detail-description">{skill.description}</p>
          <div className="detail-buy-row">
            <strong className={skill.isFree ? "free-price" : ""}>
              {skill.isFree
                ? "Free"
                : skill.priceUsdCents === null
                  ? "Coming soon"
                  : formatUsdCents(skill.priceUsdCents)}
            </strong>
            <Link className="primary-button" href={`/checkout/${skill.slug}`}>
              {skill.isFree ? "Get this Skill free" : "Continue to checkout"} <span>→</span>
            </Link>
          </div>
          <small>
            {skill.isFree
              ? "No payment required • Secure delivery by email"
              : "Visa • Mastercard • PayPal • Apple Pay • Google Pay"}
          </small>
        </div>
        <VideoPreview id={`detail-${skill.slug}`} src={skill.videoSrc} label={skill.name} accent={skill.accent} accentSoft={skill.accentSoft} detail />
      </section>
      <section className="detail-content shell">
        <article><span className="section-index">OUTCOMES</span><h2>What does this Skill help you control?</h2><ul>{skill.outcomes.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span className="section-index">WHAT YOU GET</span><h2>A clear, usable delivery package.</h2><ul>{skill.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span className="section-index">REQUIREMENTS</span><h2>What to prepare before you start.</h2><ul>{skill.requirements.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </section>
      <section className="detail-cta shell">
        <div>
          <span>READY TO TRY THE WORKFLOW?</span>
          <h2>{skill.isFree ? "Send the free Skill straight to your inbox." : "Get a private download link after secure checkout."}</h2>
        </div>
        <Link className="primary-button inverse" href={`/checkout/${skill.slug}`}>
          {skill.isFree ? "Get it free" : "Continue"} <span>→</span>
        </Link>
      </section>
    </main><SiteFooter /></>
  );
}
