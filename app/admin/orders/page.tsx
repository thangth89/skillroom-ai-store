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
  payos_order_code: number | null;
  transfer_content: string | null;
  created_at: string;
};

function derivedTransferContent(order: Pick<AdminOrder, "payos_order_code" | "transfer_content">) {
  if (order.transfer_content?.trim()) return order.transfer_content.trim().toUpperCase();
  return order.payos_order_code ? `SK${String(order.payos_order_code).slice(-12)}` : "";
}

function matchesOrderSearch(order: AdminOrder, term: string) {
  const normalizedTerm = term.toLowerCase().replace(/\s/g, "");
  const digits = term.replace(/\D/g, "");
  return (
    order.order_code.toLowerCase().includes(term.toLowerCase()) ||
    order.customer_email.toLowerCase().includes(term.toLowerCase()) ||
    derivedTransferContent(order).toLowerCase().replace(/\s/g, "").includes(normalizedTerm) ||
    (digits !== "" && String(order.payos_order_code ?? "").includes(digits))
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ delivery?: string; q?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const emailReady = hasEmailDeliveryConfig();
  const searchTerm = query.q?.trim().slice(0, 120) ?? "";
  const supabase = createAdminClient();
  let orders: AdminOrder[] = [];
  let error: { message: string } | null = null;
  let usedSearchFallback = false;

  if (searchTerm.length >= 2) {
    const result = await supabase.rpc("search_admin_orders", { search_term: searchTerm });
    orders = (result.data ?? []) as unknown as AdminOrder[];
    error = result.error;
  } else {
    const result = await supabase
      .from("orders")
      .select(
        "id, order_code, customer_email, status, total, payos_order_code, transfer_content, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<AdminOrder[]>();
    orders = result.data ?? [];
    error = result.error;
  }

  // Tương thích tạm thời trước khi migration tìm kiếm được chạy trên Supabase.
  if (error && (error.message.includes("transfer_content") || error.message.includes("search_admin_orders"))) {
    const fallback = await supabase
      .from("orders")
      .select("id, order_code, customer_email, status, total, payos_order_code, created_at")
      .order("created_at", { ascending: false })
      .limit(searchTerm.length >= 2 ? 500 : 100)
      .returns<Array<Omit<AdminOrder, "transfer_content">>>();

    orders = (fallback.data ?? []).map((order) => ({ ...order, transfer_content: null }));
    if (searchTerm.length >= 2) orders = orders.filter((order) => matchesOrderSearch(order, searchTerm));
    error = fallback.error;
    usedSearchFallback = !fallback.error;
  }

  return (
    <AdminShell eyebrow="BÁN HÀNG" title="Đơn hàng">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>
              {orders.length} {searchTerm.length >= 2 ? "KẾT QUẢ" : "ĐƠN GẦN NHẤT"}
            </span>
            <h2>Theo dõi thanh toán</h2>
          </div>
        </div>
        <form className="admin-order-search" method="get">
          <label htmlFor="order-search">Tìm đơn từ thông tin khách cung cấp</label>
          <div>
            <input
              defaultValue={searchTerm}
              id="order-search"
              minLength={2}
              name="q"
              placeholder="Nội dung chuyển khoản, mã đơn, mã payOS hoặc email"
              type="search"
            />
            <button className="primary-button" type="submit">Tìm đơn</button>
            {searchTerm ? <Link className="secondary-button" href="/admin/orders">Xóa tìm kiếm</Link> : null}
          </div>
          <small>Ví dụ khách đọc nội dung SK123456789012 trên sao kê, nhập nguyên chuỗi đó vào đây.</small>
        </form>
        {usedSearchFallback ? (
          <div className="order-search-migration-note">
            Đang dùng tìm kiếm tương thích. Hãy chạy migration mới trên Supabase để tìm nhanh trên toàn bộ dữ liệu.
          </div>
        ) : null}
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
        {!error && orders.length === 0 ? (
          <div className="admin-list-empty">
            <strong>{searchTerm ? "Không tìm thấy đơn phù hợp." : "Chưa có đơn hàng."}</strong>
            <p>{searchTerm ? "Kiểm tra lại nội dung chuyển khoản hoặc thử mã payOS/email." : "Đơn mới sẽ xuất hiện tại đây ngay khi khách tạo mã QR."}</p>
          </div>
        ) : null}
        {orders.length > 0 ? (
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
                  {derivedTransferContent(order) ? (
                    <small className="order-transfer-content">
                      Nội dung: {derivedTransferContent(order)}
                    </small>
                  ) : null}
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
