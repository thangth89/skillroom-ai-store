import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaymentStatus } from "@/components/payment-status";
import { formatVnd, maskEmail } from "@/lib/format";
import { getStoreOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

async function createQrImage(value: string | null) {
  if (!value) return null;
  try {
    return await QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 1, width: 520 });
  } catch {
    return null;
  }
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderCode: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const [{ orderCode }, query] = await Promise.all([params, searchParams]);
  const { order, item } = await getStoreOrder(orderCode);
  if (!order || !item) notFound();
  if (order.status === "paid") redirect(`/payment/success?order=${encodeURIComponent(order.order_code)}`);

  const qrImage = await createQrImage(order.qr_code_data);
  const canPay = order.status === "pending";

  return (
    <><SiteHeader /><main className="payment-page shell">
      <section className="payment-card">
        <div className="payment-heading"><div><span className="section-index">THANH TOÁN / BƯỚC 2</span><h1>Quét mã để thanh toán.</h1></div><PaymentStatus orderCode={order.order_code} initialStatus={order.status} /></div>
        {query.cancelled === "1" ? <div className="payment-cancel-note">Bạn đã quay lại từ payOS. Đơn vẫn chờ thanh toán cho tới khi hết hạn.</div> : null}
        <div className="payment-grid">
          <div className="qr-placeholder">
            {qrImage && canPay ? <img className="payment-qr-image" src={qrImage} alt={`Mã VietQR cho đơn ${order.order_code}`} /> : <div className="qr-unavailable">QR không còn khả dụng</div>}
            <small>Mã VietQR riêng cho đơn {order.order_code}</small>
          </div>
          <div className="payment-info"><dl><div><dt>Mã đơn</dt><dd>{order.order_code}</dd></div><div><dt>Sản phẩm</dt><dd>{item.skill_name}</dd></div><div><dt>Số tiền</dt><dd>{formatVnd(order.total)}</dd></div><div><dt>Gửi tới</dt><dd>{maskEmail(order.customer_email)}</dd></div></dl><div className="payment-note"><strong>Chỉ chuyển đúng số tiền trong QR</strong><p>Trang sẽ tự cập nhật sau khi webhook payOS xác nhận giao dịch.</p></div>{order.checkout_url && canPay ? <a className="secondary-button full-button payos-link" href={order.checkout_url} target="_blank" rel="noreferrer">Mở trang thanh toán payOS ↗</a> : null}</div>
        </div>
        <div className="prototype-note">Không đóng trang trong lúc chuyển khoản. Nếu ngân hàng đã báo thành công, hãy chờ vài giây để hệ thống xác minh.</div>
        <Link className="back-link payment-back-link" href={`/skills/${item.skill_slug}`}>← Quay lại sản phẩm</Link>
      </section>
    </main><SiteFooter /></>
  );
}
