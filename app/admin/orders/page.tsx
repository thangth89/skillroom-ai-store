import Link from "next/link";
import { resendOrderEmail } from "@/app/admin/orders/actions";
import { AdminShell } from "@/components/admin-shell";
import {
  adminOrderFilterParams,
  getAdminOrders,
  parseAdminOrderFilters,
} from "@/lib/admin-orders";
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ delivery?: string; q?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const filters = parseAdminOrderFilters(query);
  const searchTerm = filters.searchTerm;
  const supabase = createAdminClient();
  const { orders, error: ordersError } = await getAdminOrders(filters);
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
  const activeFilters = Boolean(searchTerm || filters.fromDate || filters.toDate);
  const exportParams = adminOrderFilterParams(filters).toString();
  const exportHref = `/api/admin/orders/export${exportParams ? `?${exportParams}` : ""}`;

  return (
    <AdminShell eyebrow="BÁN HÀNG" title="Đơn hàng">
      <section className="admin-panel">
        <div className="panel-heading"><div><span>{orders.length} {activeFilters ? "KẾT QUẢ LỌC" : "ĐƠN GẦN NHẤT"}</span><h2>Tất cả thị trường</h2></div></div>
        <form className="admin-order-filters" method="get">
          <div className="admin-order-filter-grid">
            <label className="admin-order-filter-search" htmlFor="order-search">
              <span>Tìm đơn hàng</span>
              <input defaultValue={searchTerm} id="order-search" minLength={2} name="q" placeholder="Mã đơn, nội dung chuyển khoản hoặc email" type="search" />
            </label>
            <label htmlFor="order-from-date">
              <span>Từ ngày</span>
              <input defaultValue={filters.fromDate} id="order-from-date" name="from" type="date" />
            </label>
            <label htmlFor="order-to-date">
              <span>Đến ngày</span>
              <input defaultValue={filters.toDate} id="order-to-date" name="to" type="date" />
            </label>
          </div>
          <div className="admin-order-filter-actions">
            <button className="primary-button" type="submit">Lọc đơn hàng</button>
            {filters.error ? (
              <span className="secondary-button disabled">Không thể xuất Excel</span>
            ) : (
              <a className="secondary-button admin-export-button" download href={exportHref}>Tải file Excel ↓</a>
            )}
            {activeFilters ? <Link className="admin-clear-filter" href="/admin/orders">Xóa bộ lọc</Link> : null}
          </div>
          <small>Ngày được tính theo giờ Việt Nam. File Excel sẽ dùng đúng bộ lọc đang chọn trên màn hình.</small>
        </form>
        {filters.error ? <div className="admin-form-error">{filters.error}</div> : null}
        {query.delivery === "sent" ? <div className="admin-form-success">Đã gửi lại email bàn giao.</div> : null}
        {query.delivery === "config" ? <div className="admin-form-error">Chưa cấu hình RESEND_API_KEY và EMAIL_FROM trên Vercel.</div> : null}
        {query.delivery === "error" ? <div className="admin-form-error">Không thể gửi email. Hãy kiểm tra Resend Logs và biến môi trường.</div> : null}
        {ordersError ? <div className="admin-form-error">Không thể tải đơn hàng: {ordersError.message}</div> : null}
        {!ordersError && orders.length === 0 ? (
          <div className="admin-list-empty"><strong>{activeFilters ? "Không tìm thấy đơn phù hợp với bộ lọc." : "Chưa có đơn hàng."}</strong><p>Đơn payOS, miễn phí và quốc tế sẽ cùng xuất hiện tại đây.</p></div>
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
