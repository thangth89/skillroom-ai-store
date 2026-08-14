import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkillGrid } from "@/components/skill-grid";
import { getCatalogPage } from "@/lib/catalog";
import { getStoreLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreLocale()) === "vi" ? "Kho Skill" : "Skill Library" };
}

export default async function SkillsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [query, locale] = await Promise.all([searchParams, getStoreLocale()]);
  const vi = locale === "vi";
  const catalog = await getCatalogPage(Number(query.page) || 1, locale);
  return (
    <><SiteHeader /><main>
      <section className="page-hero shell">
        <span className="section-index">{vi ? "KHO SKILL" : "SKILL LIBRARY"} • {vi ? "TRANG" : "PAGE"} {catalog.page}</span>
        <h1>{vi ? "Tìm đúng Skill cho công việc của bạn." : "Find the right Skill for the work ahead."}</h1>
        <p>{vi ? `Khám phá ${catalog.total} Skill được phân nhóm rõ ràng, có video kết quả và thông tin sử dụng trước khi mua.` : `Explore ${catalog.total} clearly structured Skills with real video output and practical details before you choose.`}</p>
      </section>
      <section className="catalog-section inner-catalog"><div className="shell">
        <div className="catalog-toolbar"><span>{catalog.total} {vi ? "sản phẩm" : "products"}</span><span>{vi ? "6 sản phẩm mỗi trang" : "6 per page"} · 3 × 2</span></div>
        <SkillGrid items={catalog.items} locale={locale} />
        <nav className="pagination" aria-label={vi ? "Phân trang" : "Pagination"}>
          <Link className={catalog.page === 1 ? "disabled" : ""} href={`/skills?page=${Math.max(1, catalog.page - 1)}`}>← {vi ? "Trước" : "Previous"}</Link>
          <div>{Array.from({ length: catalog.pages }, (_, index) => index + 1).map((page) => <Link key={page} className={page === catalog.page ? "active" : ""} href={`/skills?page=${page}`}>{page}</Link>)}</div>
          <Link className={catalog.page === catalog.pages ? "disabled" : ""} href={`/skills?page=${Math.min(catalog.pages, catalog.page + 1)}`}>{vi ? "Sau" : "Next"} →</Link>
        </nav>
      </div></section>
    </main><SiteFooter /></>
  );
}
