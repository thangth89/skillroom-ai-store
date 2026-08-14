import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SkillGrid } from "@/components/skill-grid";
import { getCatalogPage } from "@/lib/catalog";
import { getStoreLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getStoreLocale();
  const vi = locale === "vi";
  const catalog = await getCatalogPage(1, locale);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow"><span /> {vi ? "Skill AI được kiểm chứng bằng video" : "AI Skills verified by real video results"}</div>
            <h1>{vi ? "Xem kết quả thực tế trước khi mua Skill AI." : "See what a Skill creates before you get it."}</h1>
            <p>{vi ? "Khám phá thành phẩm, đọc đầy đủ cách hoạt động và chọn đúng Skill cho công việc của bạn." : "Watch the output, understand the workflow and choose a practical AI Skill with confidence."}</p>
            <div className="hero-actions">
              <Link className="primary-button" href="#catalog">{vi ? "Khám phá kho Skill" : "Explore the library"} <span>→</span></Link>
              <Link className="secondary-button" href="/support">{vi ? "Xem hướng dẫn" : "How it works"}</Link>
            </div>
            <div className="hero-benefits" aria-label={vi ? "Lợi ích mua hàng" : "Store benefits"}>
              <span>✓ {vi ? "Xem trước kết quả" : "Watch before choosing"}</span>
              <span>✓ {vi ? "Thanh toán VietQR" : "Free starter Skills"}</span>
              <span>✓ {vi ? "Nhận file qua email" : "Secure email delivery"}</span>
            </div>
          </div>
          <div className="hero-proof" aria-label={vi ? "Thông tin cửa hàng" : "Store information"}>
            <div className="proof-orbit"><span>{vi ? "ĐANG HOẠT ĐỘNG" : "LIVE LIBRARY"}</span></div>
            <div className="proof-main"><span>{vi ? "KHO SẢN PHẨM SỐ" : "DIGITAL SKILL STORE"}</span><h2>{vi ? <>Mua nhanh.<br />Nhận Skill tự động.</> : <>Learn faster.<br />Create with control.</>}</h2></div>
            <div className="proof-copy"><strong>{catalog.total}</strong><span>{vi ? <>Skill đang có<br />trong cửa hàng</> : <>Skills available<br />in the library</>}</span></div>
            <div className="proof-foot">{vi ? "Video chỉ tải khi bạn bấm xem • Tiết kiệm dữ liệu" : "Videos load only after you click • Bandwidth friendly"}</div>
          </div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="shell">
            <div className="section-heading">
              <div><span className="section-index">{vi ? "KHO SKILL NỔI BẬT" : "FEATURED SKILL LIBRARY"}</span><h2>{vi ? "Chọn Skill bằng kết quả thật." : "Choose by the result, not the promise."}</h2></div>
              <p>{vi ? "Bấm “Xem video” trên từng sản phẩm để xem thành phẩm. Video không tự tải hoặc tự phát." : "Click “Watch video” on any card to load the result. Nothing auto-plays or consumes video data in the background."}</p>
            </div>
            <SkillGrid items={catalog.items} locale={locale} />
            <div className="catalog-more">
              <div><strong>{catalog.total} Skill{vi ? "" : "s"}</strong><span>{vi ? "đang có trong kho" : "currently in the library"}</span></div>
              <Link className="secondary-button light" href={catalog.pages > 1 ? "/skills?page=2" : "/skills"}>{vi ? (catalog.pages > 1 ? "Xem trang tiếp theo" : "Mở kho Skill") : (catalog.pages > 1 ? "View the next page" : "Open the Skill Library")} <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="process shell">
          <div className="section-heading compact"><div><span className="section-index">{vi ? "QUY TRÌNH MUA HÀNG" : "HOW IT WORKS"}</span><h2>{vi ? "Đơn giản trong ba bước." : "Simple from preview to delivery."}</h2></div></div>
          <div className="process-grid">
            <article><span>01</span><h3>{vi ? "Xem video" : "Watch the result"}</h3><p>{vi ? "Đánh giá kết quả thực tế ngay trên từng sản phẩm." : "Review real output directly on each product page."}</p></article>
            <article><span>02</span><h3>{vi ? "Thanh toán QR" : "Choose free or paid"}</h3><p>{vi ? "Nhập email và quét VietQR được tạo riêng cho đơn hàng." : "Get a starter Skill by email or continue to the available international checkout."}</p></article>
            <article><span>03</span><h3>{vi ? "Nhận Skill" : "Receive your Skill"}</h3><p>{vi ? "Link tải bảo mật được gửi tự động sau khi payOS xác nhận." : "A private, time-limited download link is delivered to your inbox."}</p></article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
