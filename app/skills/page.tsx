import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkillGrid } from "@/components/skill-grid";
import { getCatalogPage } from "@/lib/catalog";

export const metadata = { title: "Skill Library" };
export const dynamic = "force-dynamic";

export default async function SkillsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = await searchParams;
  const catalog = await getCatalogPage(Number(query.page) || 1);
  return (
    <><SiteHeader /><main>
      <section className="page-hero shell">
        <span className="section-index">SKILL LIBRARY • PAGE {catalog.page}</span>
        <h1>Find the right Skill for the work ahead.</h1>
        <p>Explore {catalog.total} clearly structured Skills with real video output and practical details before you choose.</p>
      </section>
      <section className="catalog-section inner-catalog"><div className="shell">
        <div className="catalog-toolbar"><span>{catalog.total} products</span><span>6 per page · 3 × 2</span></div>
        <SkillGrid items={catalog.items} />
        <nav className="pagination" aria-label="Pagination">
          <Link className={catalog.page === 1 ? "disabled" : ""} href={`/skills?page=${Math.max(1, catalog.page - 1)}`}>← Previous</Link>
          <div>{Array.from({ length: catalog.pages }, (_, index) => index + 1).map((page) => <Link key={page} className={page === catalog.page ? "active" : ""} href={`/skills?page=${page}`}>{page}</Link>)}</div>
          <Link className={catalog.page === catalog.pages ? "disabled" : ""} href={`/skills?page=${Math.min(catalog.pages, catalog.page + 1)}`}>Next →</Link>
        </nav>
      </div></section>
    </main><SiteFooter /></>
  );
}
