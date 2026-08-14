import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { formatOrderAmount } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const statusLabel: Record<OrderStatus, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

type AdminOrder = {
  id: string;
  order_code: string;
  customer_email: string;
  status: OrderStatus;
  total: number;
  currency: string;
  created_at: string;
};

function matchesOrderSearch(order: AdminOrder, term: string) {
  const normalizedTerm = term.toLowerCase();
  return order.order_code.toLowerCase().includes(normalizedTerm) || order.customer_email.toLowerCase().includes(normalizedTerm);
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ delivery?: string; q?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const searchTerm = query.q?.trim().slice(0, 120) ?? "";
  const result = await createAdminClient()
    .from("orders")
    .select("id, order_code, customer_email, status, total, currency, created_at")
    .order("created_at", { ascending: false })
    .limit(searchTerm.length >= 2 ? 500 : 100)
    .returns<AdminOrder[]>();
  let orders = result.data ?? [];
  if (searchTerm.length >= 2) orders = orders.filter((order) => matchesOrderSearch(order, searchTerm));

  return (
    <AdminShell eyebrow="BÁN HÀNG" title="Đơn hàng">
      <section className="admin-panel">
        <div className="panel-heading"><div><span>{orders.length} {searchTerm ? "KẾT QUẢ" : "ĐƠN GẦN NHẤT"}</span><h2>Tất cả thị trường</h2></div></div>
        <form className="admin-order-search" method="get">
          <label htmlFor="order-search">Tìm đơn hàng</label>
          <div>
            <input defaultValue={searchTerm} id="order-search" minLength={2} name="q" placeholder="Mã đơn hoặc email khách hàng" type="search" />
            <button className="primary-button" type="submit">Tìm đơn</button>
            {searchTerm ? <Link className="secondary-button" href="/admin/orders">Xóa tìm kiếm</Link> : null}
          </div>
          <small>Danh sách dùng chung cho VietQR, Skill miễn phí và cổng thanh toán quốc tế.</small>
        </form>
        {query.delivery === "sent" ? <div className="admin-form-success">Đã gửi lại email bàn giao.</div> : null}
        {query.delivery === "config" ? <div className="admin-form-error">Chưa cấu hình RESEND_API_KEY và EMAIL_FROM trên Vercel.</div> : null}
        {query.delivery === "error" ? <div className="admin-form-error">Không thể gửi email. Hãy kiểm tra Resend Logs và biến môi trường.</div> : null}
        {result.error ? <div className="admin-form-error">Không thể tải đơn hàng: {result.error.message}</div> : null}
        {!result.error && orders.length === 0 ? (
          <div className="admin-list-empty"><strong>{searchTerm ? "Không tìm thấy đơn phù hợp." : "Chưa có đơn hàng."}</strong><p>Đơn payOS, miễn phí và quốc tế sẽ cùng xuất hiện tại đây.</p></div>
        ) : null}
        {orders.length ? (
          <div className="admin-table">
            <div className="table-row order-table-row table-head"><span>Đơn hàng</span><span>Thị trường</span><span>Email</span><span>Tổng tiền</span><span>Trạng thái</span></div>
            {orders.map((order) => {
              const vietnam = order.currency.toUpperCase() === "VND";
              const free = order.order_code.startsWith("FREE-");
              return (
                <div className="table-row order-table-row" key={order.id}>
                  <span><Link className="order-code-link" href={`/admin/orders/${encodeURIComponent(order.order_code)}`}>{order.order_code} →</Link><small>{new Date(order.created_at).toLocaleString("vi-VN")}</small></span>
                  <span><i className={`market-status ${vietnam ? "vietnam" : "international"}`}>{vietnam ? "Việt Nam" : "Quốc tế"}</i>{free ? <small>Skill miễn phí</small> : null}</span>
                  <span>{order.customer_email}</span>
                  <span>{formatOrderAmount(order.total, order.currency)}</span>
                  <span className="order-status-actions"><i className={`order-status ${order.status}`}>{statusLabel[order.status]}</i></span>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
