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
            <div className="eyebrow"><span /> Skill AI có video kiểm chứng</div>
            <h1>Thấy kết quả trước.<br /><em>Chọn đúng Skill sau.</em></h1>
            <p>Xem trực tiếp thành phẩm do từng Skill tạo ra, đọc rõ cách hoạt động rồi mới quyết định mua.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="#catalog">Xem video kết quả <span>↓</span></Link>
              <Link className="secondary-button" href="/support">Skill hoạt động thế nào?</Link>
            </div>
          </div>
          <div className="hero-proof" aria-label="Thông tin cửa hàng">
            <div className="proof-orbit"><span>PLAY</span></div>
            <div className="proof-copy"><strong>9</strong><span>Skill nổi bật<br />trên mỗi trang</span></div>
            <div className="proof-foot">Hover trên máy tính<br />Cuộn tới trên điện thoại</div>
          </div>
        </section>

        <section className="catalog-section" id="catalog">
          <div className="shell">
            <div className="section-heading">
              <div><span className="section-index">01 / KHO SKILL</span><h2>Xem thành phẩm ngay trên thẻ.</h2></div>
              <p>Di chuột vào video để phát. Trên điện thoại, video sẽ tự chạy khi nằm trong vùng nhìn.</p>
            </div>
            <SkillGrid items={catalog.items} />
            <div className="catalog-more">
              <div><strong>{catalog.total} Skill</strong><span>đang có trong kho</span></div>
              <Link className="secondary-button light" href={catalog.pages > 1 ? "/skills?page=2" : "/skills"}>{catalog.pages > 1 ? "Xem trang tiếp theo" : "Mở kho Skill"} <span>→</span></Link>
            </div>
          </div>
        </section>

        <section className="process shell">
          <div className="section-heading compact"><div><span className="section-index">02 / QUY TRÌNH</span><h2>Mua gọn trong ba bước.</h2></div></div>
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
