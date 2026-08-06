import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkillGrid } from "@/components/skill-grid";
import { getSkillsPage } from "@/lib/skills";

export const metadata = { title: "Kho Skill" };

export default async function SkillsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = await searchParams;
  const catalog = getSkillsPage(Number(query.page) || 1);
  return (
    <><SiteHeader /><main>
      <section className="page-hero shell">
        <span className="section-index">KHO SKILL / TRANG {catalog.page}</span>
        <h1>Chọn bằng <em>kết quả.</em></h1>
        <p>{catalog.total} Skill được phân nhóm rõ ràng. Mỗi trang hiển thị tối đa 9 sản phẩm để giữ tốc độ tải nhanh.</p>
      </section>
      <section className="catalog-section inner-catalog"><div className="shell">
        <div className="catalog-toolbar"><span>{catalog.total} sản phẩm</span><span>3 cột × 3 hàng</span></div>
        <SkillGrid items={catalog.items} />
        <nav className="pagination" aria-label="Phân trang">
          <Link className={catalog.page === 1 ? "disabled" : ""} href={`/skills?page=${Math.max(1, catalog.page - 1)}`}>← Trước</Link>
          <div>{Array.from({ length: catalog.pages }, (_, index) => index + 1).map((page) => <Link key={page} className={page === catalog.page ? "active" : ""} href={`/skills?page=${page}`}>{page}</Link>)}</div>
          <Link className={catalog.page === catalog.pages ? "disabled" : ""} href={`/skills?page=${Math.min(catalog.pages, catalog.page + 1)}`}>Sau →</Link>
        </nav>
      </div></section>
    </main><SiteFooter /></>
  );
}
