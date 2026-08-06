import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { formatVnd } from "@/lib/format";
import { getCatalogSkillOrFirst } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function PaymentPage({ params, searchParams }: { params: Promise<{ orderCode: string }>; searchParams: Promise<{ skill?: string; email?: string }> }) {
  const [{ orderCode }, query] = await Promise.all([params, searchParams]);
  const skill = await getCatalogSkillOrFirst(query.skill || "");
  if (!skill) return null;
  return (
    <><SiteHeader /><main className="payment-page shell">
      <section className="payment-card">
        <div className="payment-heading"><div><span className="section-index">THANH TOÁN / BƯỚC 2</span><h1>Quét mã để thanh toán.</h1></div><span className="waiting-dot">Đang chờ tiền</span></div>
        <div className="payment-grid">
          <div className="qr-placeholder" aria-label="Vị trí mã QR payOS"><div className="qr-pattern"><span>payOS</span></div><small>QR payOS sẽ được tạo tại đây</small></div>
          <div className="payment-info"><dl><div><dt>Mã đơn</dt><dd>{orderCode}</dd></div><div><dt>Sản phẩm</dt><dd>{skill.name}</dd></div><div><dt>Số tiền</dt><dd>{formatVnd(skill.price)}</dd></div><div><dt>Gửi tới</dt><dd>{query.email || "Email khách hàng"}</dd></div></dl><div className="payment-note"><strong>Không đóng trang này</strong><p>Website sẽ tự cập nhật khi payOS xác nhận giao dịch thành công.</p></div></div>
        </div>
        <div className="prototype-note">Bản cấu trúc chưa kết nối tài khoản payOS thật. <Link href={`/payment/success?order=${orderCode}&skill=${skill.slug}`}>Xem trước trang thành công →</Link></div>
      </section>
    </main><SiteFooter /></>
  );
}
