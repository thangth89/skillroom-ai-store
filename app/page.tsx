import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkillGrid } from "@/components/skill-grid";
import { getCatalogPage } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getCatalogPage(1);
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow"><span /> AI Skills verified by real video results</div>
            <h1>See what a Skill creates before you get it.</h1>
            <p>Watch the output, understand the workflow and choose a practical AI Skill with confidence.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="#catalog">Explore the library <span>→</span></Link>
              <Link className="secondary-button" href="/support">How it works</Link>
            </div>
            <div className="hero-benefits" aria-label="Store benefits">
              <span>✓ Watch before choosing</span>
              <span>✓ Free starter Skills</span>
              <span>✓ Secure email delivery</span>
            </div>
          </div>
          <div className="hero-proof" aria-label="Store information">
            <div className="proof-orbit"><span>LIVE LIBRARY</span></div>
            <div className="proof-main"><span>DIGITAL SKILL STORE</span><h2>Learn faster.<br />Create with control.</h2></div>
            <div className="proof-copy"><strong>{catalog.total}</strong><span>Skills available<br />in the library</span></div>
            <div className="proof-foot">Videos load only after you click • Bandwidth friendly</div>
          </div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="shell">
            <div className="section-heading">
              <div><span className="section-index">FEATURED SKILL LIBRARY</span><h2>Choose by the result, not the promise.</h2></div>
              <p>Click “Watch video” on any card to load the result. Nothing auto-plays or consumes video data in the background.</p>
            </div>
            <SkillGrid items={catalog.items} />
            <div className="catalog-more">
              <div><strong>{catalog.total} Skills</strong><span>currently in the library</span></div>
              <Link className="secondary-button light" href={catalog.pages > 1 ? "/skills?page=2" : "/skills"}>{catalog.pages > 1 ? "View the next page" : "Open the Skill Library"} <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="process shell">
          <div className="section-heading compact"><div><span className="section-index">HOW IT WORKS</span><h2>Simple from preview to delivery.</h2></div></div>
          <div className="process-grid">
            <article><span>01</span><h3>Watch the result</h3><p>Review real output directly on each product page.</p></article>
            <article><span>02</span><h3>Choose free or paid</h3><p>Get a starter Skill by email or use secure international checkout for premium Skills.</p></article>
            <article><span>03</span><h3>Receive your Skill</h3><p>A private, time-limited download link is delivered to your inbox.</p></article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
