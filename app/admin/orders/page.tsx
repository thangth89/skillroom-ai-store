import Link from "next/link";
import { resendOrderEmail } from "@/app/admin/orders/actions";
import { AdminShell } from "@/components/admin-shell";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { formatOrderAmount } from "@/lib/format";
import { getOrderTransferContent, type OrderStatus } from "@/lib/orders";
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
  payos_order_code: number | null;
  transfer_content: string | null;
  created_at: string;
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ delivery?: string; q?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const searchTerm = query.q?.trim().slice(0, 120) ?? "";
  const supabase = createAdminClient();
  let orders: AdminOrder[] = [];
  let ordersError: { message: string } | null = null;
  if (searchTerm.length >= 2) {
    const searchResult = await supabase.rpc("search_admin_orders", { search_term: searchTerm });
    orders = Array.isArray(searchResult.data) ? searchResult.data as AdminOrder[] : [];
    ordersError = searchResult.error;
  } else {
    const recentResult = await supabase
      .from("orders")
      .select("id, order_code, customer_email, status, total, currency, payos_order_code, transfer_content, created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<AdminOrder[]>();
    orders = recentResult.data ?? [];
    ordersError = recentResult.error;
  }
  const deliveryItemsResult = orders.length
    ? await supabase
        .from("order_items")
        .select("order_id")
        .in("order_id", orders.map((order) => order.id))
        .not("file_path", "is", null)
        .returns<{ order_id: string }[]>()
    : { data: [], error: null };
  const deliveryOrderIds = new Set((deliveryItemsResult.data ?? []).map((item) => item.order_id));
  const emailReady = hasEmailDeliveryConfig();

  return (
    <AdminShell eyebrow="BÁN HÀNG" title="Đơn hàng">
      <section className="admin-panel">
        <div className="panel-heading"><div><span>{orders.length} {searchTerm ? "KẾT QUẢ" : "ĐƠN GẦN NHẤT"}</span><h2>Tất cả thị trường</h2></div></div>
        <form className="admin-order-search" method="get">
          <label htmlFor="order-search">Tìm đơn hàng</label>
          <div>
            <input defaultValue={searchTerm} id="order-search" minLength={2} name="q" placeholder="Mã đơn, nội dung chuyển khoản hoặc email" type="search" />
            <button className="primary-button" type="submit">Tìm đơn</button>
            {searchTerm ? <Link className="secondary-button" href="/admin/orders">Xóa tìm kiếm</Link> : null}
          </div>
          <small>Có thể nhập nguyên nội dung chuyển khoản khách đọc từ sao kê, kể cả khi có khoảng trắng.</small>
        </form>
        {query.delivery === "sent" ? <div className="admin-form-success">Đã gửi lại email bàn giao.</div> : null}
        {query.delivery === "config" ? <div className="admin-form-error">Chưa cấu hình RESEND_API_KEY và EMAIL_FROM trên Vercel.</div> : null}
        {query.delivery === "error" ? <div className="admin-form-error">Không thể gửi email. Hãy kiểm tra Resend Logs và biến môi trường.</div> : null}
        {ordersError ? <div className="admin-form-error">Không thể tải đơn hàng: {ordersError.message}</div> : null}
        {!ordersError && orders.length === 0 ? (
          <div className="admin-list-empty"><strong>{searchTerm ? "Không tìm thấy đơn phù hợp." : "Chưa có đơn hàng."}</strong><p>Đơn payOS, miễn phí và quốc tế sẽ cùng xuất hiện tại đây.</p></div>
        ) : null}
        {orders.length ? (
          <div className="admin-table">
            <div className="table-row order-table-row table-head"><span>Đơn hàng</span><span>Thị trường</span><span>Email</span><span>Tổng tiền</span><span>Trạng thái</span></div>
            {orders.map((order) => {
              const vietnam = order.currency.toUpperCase() === "VND";
              const free = order.order_code.startsWith("FREE-");
              const transferContent = getOrderTransferContent(order);
              const canResend = order.status === "paid" && deliveryOrderIds.has(order.id);
              return (
                <div className="table-row order-table-row" key={order.id}>
                  <span>
                    <Link className="order-code-link" href={`/admin/orders/${encodeURIComponent(order.order_code)}`}>{order.order_code} →</Link>
                    <small>{new Date(order.created_at).toLocaleString("vi-VN")}</small>
                    {transferContent ? <small className="order-transfer-content">Nội dung CK: <strong>{transferContent}</strong></small> : null}
                  </span>
                  <span><i className={`market-status ${vietnam ? "vietnam" : "international"}`}>{vietnam ? "Việt Nam" : "Quốc tế"}</i>{free ? <small>Skill miễn phí</small> : null}</span>
                  <span>{order.customer_email}</span>
                  <span>{formatOrderAmount(order.total, order.currency)}</span>
                  <span className="order-status-actions">
                    <i className={`order-status ${order.status}`}>{statusLabel[order.status]}</i>
                    {canResend ? (
                      <form action={resendOrderEmail}>
                        <input name="order_id" type="hidden" value={order.id} />
                        <input name="return_to" type="hidden" value="/admin/orders" />
                        <button className="order-email-button" disabled={!emailReady} type="submit">
                          {emailReady ? "Gửi lại email" : "Email chưa cấu hình"}
                        </button>
                      </form>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
