import Link from "next/link";
import { resendOrderEmail } from "@/app/admin/orders/actions";
import { AdminShell } from "@/components/admin-shell";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { formatVnd } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const statusLabel: Record<OrderStatus, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã huỷ",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

type AdminOrder = {
  id: string;
  order_code: string;
  customer_email: string;
  status: OrderStatus;
  total: number;
  created_at: string;
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ delivery?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const emailReady = hasEmailDeliveryConfig();
  const { data: orders, error } = await createAdminClient()
    .from("orders")
    .select("id, order_code, customer_email, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<AdminOrder[]>();

  return (
    <AdminShell eyebrow="BÁN HÀNG" title="Đơn hàng">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>{orders?.length ?? 0} ĐƠN GẦN NHẤT</span>
            <h2>Theo dõi thanh toán</h2>
          </div>
        </div>
        {query.delivery === "sent" ? (
          <div className="admin-form-success">Đã gửi lại email bàn giao Skill.</div>
        ) : null}
        {query.delivery === "config" ? (
          <div className="admin-form-error">
            Chưa cấu hình RESEND_API_KEY và EMAIL_FROM trên Vercel.
          </div>
        ) : null}
        {query.delivery === "error" ? (
          <div className="admin-form-error">
            Không thể gửi email. Hãy kiểm tra Resend Logs và biến môi trường.
          </div>
        ) : null}
        {query.delivery === "invalid" ? (
          <div className="admin-form-error">Mã đơn hàng không hợp lệ.</div>
        ) : null}
        {error ? (
          <div className="admin-form-error">Không thể đọc đơn hàng: {error.message}</div>
        ) : null}
        {!error && orders?.length === 0 ? (
          <div className="admin-list-empty">
            <strong>Chưa có đơn hàng.</strong>
            <p>Đơn mới sẽ xuất hiện tại đây ngay khi khách tạo mã QR.</p>
          </div>
        ) : null}
        {orders && orders.length > 0 ? (
          <div className="admin-table">
            <div className="table-row order-table-row table-head">
              <span>Mã đơn</span>
              <span>Email</span>
              <span>Tổng tiền</span>
              <span>Trạng thái</span>
            </div>
            {orders.map((order) => (
              <div className="table-row order-table-row" key={order.id}>
                <span>
                  <Link
                    className="order-code-link"
                    href={`/admin/orders/${encodeURIComponent(order.order_code)}`}
                  >
                    {order.order_code} →
                  </Link>
                  <small>
                    {new Date(order.created_at).toLocaleString("vi-VN", {
                      timeZone: "Asia/Ho_Chi_Minh",
                    })}
                  </small>
                </span>
                <span>{order.customer_email}</span>
                <span>{formatVnd(order.total)}</span>
                <span className="order-status-actions">
                  <i className={`order-status ${order.status}`}>{statusLabel[order.status]}</i>
                  {order.status === "paid" ? (
                    <form action={resendOrderEmail}>
                      <input name="order_id" type="hidden" value={order.id} />
                      <button className="order-email-button" disabled={!emailReady} type="submit">
                        {emailReady ? "Gửi lại email" : "Chưa cấu hình email"}
                      </button>
                    </form>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
