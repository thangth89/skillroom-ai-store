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
            <div className="eyebrow"><span /> Skill AI được kiểm chứng bằng video</div>
            <h1>Xem kết quả thực tế trước khi mua Skill AI.</h1>
            <p>Khám phá thành phẩm, đọc đầy đủ cách hoạt động và chọn đúng Skill cho công việc của bạn.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="#catalog">Khám phá kho Skill <span>→</span></Link>
              <Link className="secondary-button" href="/support">Xem hướng dẫn</Link>
            </div>
            <div className="hero-benefits" aria-label="Lợi ích mua hàng">
              <span>✓ Xem trước kết quả</span>
              <span>✓ Thanh toán VietQR</span>
              <span>✓ Nhận file qua email</span>
            </div>
          </div>
          <div className="hero-proof" aria-label="Thông tin cửa hàng">
            <div className="proof-orbit"><span>ĐANG HOẠT ĐỘNG</span></div>
            <div className="proof-main"><span>KHO SẢN PHẨM SỐ</span><h2>Mua nhanh.<br />Nhận Skill tự động.</h2></div>
            <div className="proof-copy"><strong>{catalog.total}</strong><span>Skill đang có<br />trong cửa hàng</span></div>
            <div className="proof-foot">Video chỉ tải khi bạn bấm xem • Tiết kiệm dữ liệu</div>
          </div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="shell">
            <div className="section-heading">
              <div><span className="section-index">KHO SKILL NỔI BẬT</span><h2>Chọn Skill bằng kết quả thật.</h2></div>
              <p>Bấm “Xem video” trên từng sản phẩm để xem thành phẩm. Video không tự tải hoặc tự phát.</p>
            </div>
            <SkillGrid items={catalog.items} />
            <div className="catalog-more">
              <div><strong>{catalog.total} Skill</strong><span>đang có trong kho</span></div>
              <Link className="secondary-button light" href={catalog.pages > 1 ? "/skills?page=2" : "/skills"}>{catalog.pages > 1 ? "Xem trang tiếp theo" : "Mở kho Skill"} <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="process shell">
          <div className="section-heading compact"><div><span className="section-index">QUY TRÌNH MUA HÀNG</span><h2>Đơn giản trong ba bước.</h2></div></div>
          <div className="process-grid">
            <article><span>01</span><h3>Xem video</h3><p>Đánh giá kết quả thực tế ngay trên từng sản phẩm.</p></article>
            <article><span>02</span><h3>Thanh toán QR</h3><p>Nhập email và quét VietQR được tạo riêng cho đơn hàng.</p></article>
            <article><span>03</span><h3>Nhận Skill</h3><p>Link tải bảo mật được gửi tự động sau khi payOS xác nhận.</p></article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
