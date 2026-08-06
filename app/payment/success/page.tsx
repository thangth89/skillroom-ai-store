import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getStoreOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const query = await searchParams;
  if (!query.order) notFound();
  const { order, item } = await getStoreOrder(query.order);
  if (!order || !item) notFound();
  if (order.status !== "paid") redirect(`/payment/${encodeURIComponent(order.order_code)}`);

  return (
    <><SiteHeader /><main className="success-page shell"><section className="success-card"><div className="success-mark">✓</div><span className="section-index">THANH TOÁN THÀNH CÔNG</span><h1>Đơn hàng đã được xác nhận.</h1><p>Đơn <strong>{order.order_code}</strong> cho <strong>{item.skill_name}</strong> đã được webhook payOS xác minh. Bước gửi file qua email sẽ được kích hoạt sau khi cấu hình dịch vụ email.</p><div className="success-actions"><Link className="primary-button" href="/skills">Xem thêm Skill <span>→</span></Link><Link className="secondary-button" href="/support">Cần hỗ trợ?</Link></div></section></main><SiteFooter /></>
  );
}
