import Link from "next/link";
import { notFound } from "next/navigation";
import { resendOrderEmail, updateOrderEmailAndResend } from "@/app/admin/orders/actions";
import { AdminShell } from "@/components/admin-shell";
import { CopyValueButton } from "@/components/copy-value-button";
import {
  type AdminDownloadToken,
  getAdminOrderDetails,
} from "@/lib/admin-order-details";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { DOWNLOAD_LIMIT } from "@/lib/downloads";
import { formatOrderAmount } from "@/lib/format";
import { getOrderTransferContent, type OrderStatus } from "@/lib/orders";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const statusLabel: Record<OrderStatus, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã huỷ",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

const paymentStatusLabel: Record<string, string> = {
  PAID: "Đã xác nhận",
  AMOUNT_MISMATCH: "Sai số tiền",
};

function formatDateTime(value: string | null) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function getTokenState(token: AdminDownloadToken) {
  if (token.download_count >= DOWNLOAD_LIMIT) {
    return { className: "exhausted", label: "Đã hết lượt" };
  }
  if (new Date(token.expires_at).getTime() <= Date.now()) {
    return { className: "expired", label: "Đã hết hạn" };
  }
  return { className: "ready", label: "Còn hiệu lực" };
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderCode: string }>;
  searchParams: Promise<{ delivery?: string }>;
}) {
  await requireAdmin();
  const [{ orderCode }, query] = await Promise.all([params, searchParams]);
  const details = await getAdminOrderDetails(orderCode);

  if (!details.order) notFound();

  const { order, items, payments, tokens, error } = details;
  const emailReady = hasEmailDeliveryConfig();
  const returnTo = `/admin/orders/${encodeURIComponent(order.order_code)}`;
  const transferContent = getOrderTransferContent(order);
  const amountMismatch = payments.some((payment) =>
    payment.status.toUpperCase().includes("MISMATCH"),
  );
  const isLemonSqueezyOrder = payments.some((payment) => payment.provider === "lemonsqueezy");
  const totalDownloads = tokens.reduce((sum, token) => sum + token.download_count, 0);
  const lastDownload = tokens
    .map((token) => token.used_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return (
    <AdminShell eyebrow="BÁN HÀNG" title="Chi tiết đơn hàng">
      <div className="order-detail-toolbar">
        <Link className="back-link" href="/admin/orders">
          ← Quay lại danh sách
        </Link>
        <div className="order-detail-actions">
          <CopyValueButton label="Sao chép mã đơn" value={order.order_code} />
          <CopyValueButton label="Sao chép email" value={order.customer_email} />
          {transferContent ? (
            <CopyValueButton label="Sao chép nội dung CK" value={transferContent} />
          ) : null}
          <a className="secondary-button" href={`mailto:${order.customer_email}`}>
            Gửi email hỗ trợ
          </a>
          {order.checkout_url && order.status === "pending" ? (
            <a
              className="secondary-button"
              href={order.checkout_url}
              rel="noreferrer"
              target="_blank"
            >
              Mở payOS ↗
            </a>
          ) : null}
          {order.status === "paid" && !isLemonSqueezyOrder ? (
            <form action={resendOrderEmail}>
              <input name="order_id" type="hidden" value={order.id} />
              <input name="return_to" type="hidden" value={returnTo} />
              <button className="primary-button" disabled={!emailReady} type="submit">
                {emailReady ? "Cấp link mới & gửi email" : "Chưa cấu hình email"}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {query.delivery === "sent" ? (
        <div className="admin-form-success">
          Đã tạo liên kết tải mới và gửi email đến {order.customer_email}.
        </div>
      ) : null}
      {query.delivery === "config" ? (
        <div className="admin-form-error">
          Chưa cấu hình RESEND_API_KEY và EMAIL_FROM trên Vercel.
        </div>
      ) : null}
      {query.delivery === "error" ? (
        <div className="admin-form-error">
          Không thể gửi email. Hãy kiểm tra Resend Logs và cấu hình máy chủ.
        </div>
      ) : null}
      {query.delivery === "invalid" ? (
        <div className="admin-form-error">Mã đơn hàng không hợp lệ.</div>
      ) : null}
      {query.delivery === "corrected" ? (
        <div className="admin-form-success">
          Đã cập nhật email, thu hồi các link tải cũ và gửi link mới đến {order.customer_email}.
        </div>
      ) : null}
      {query.delivery === "email_invalid" ? (
        <div className="admin-form-error">Email mới hoặc mã đơn không hợp lệ.</div>
      ) : null}
      {query.delivery === "email_update_error" ? (
        <div className="admin-form-error">Không thể cập nhật email của đơn hàng.</div>
      ) : null}
      {query.delivery === "not_paid" ? (
        <div className="admin-form-error">Chỉ sửa email và cấp lại link cho đơn đã thanh toán.</div>
      ) : null}
      {query.delivery === "security_error" ? (
        <div className="admin-form-error">
          Email đã được sửa nhưng chưa thể thu hồi link cũ. Không gửi lại file trước khi kiểm tra Supabase.
        </div>
      ) : null}
      {query.delivery === "email_saved_config" ? (
        <div className="admin-form-error">
          Email đã được sửa và link cũ đã thu hồi, nhưng Vercel chưa cấu hình Resend.
        </div>
      ) : null}
      {query.delivery === "email_saved_error" ? (
        <div className="admin-form-error">
          Email đã được sửa và link cũ đã thu hồi, nhưng chưa gửi được email mới. Kiểm tra Resend Logs rồi bấm gửi lại.
        </div>
      ) : null}
      {error ? (
        <div className="admin-form-error">Một phần dữ liệu chưa đọc được: {error.message}</div>
      ) : null}
      {amountMismatch ? (
        <div className="order-detail-warning">
          Có giao dịch không khớp số tiền đơn hàng. Không bàn giao thêm file trước khi kiểm tra
          trong payOS.
        </div>
      ) : null}

      <section className="order-detail-overview">
        <article>
          <span>TRẠNG THÁI</span>
          <i className={`order-status ${order.status}`}>{statusLabel[order.status]}</i>
          <small>Cập nhật {formatDateTime(order.updated_at)}</small>
        </article>
        <article>
          <span>TỔNG THANH TOÁN</span>
          <strong>{formatOrderAmount(order.total, order.currency)}</strong>
          <small>{order.currency}</small>
        </article>
        <article>
          <span>LIÊN KẾT ĐÃ CẤP</span>
          <strong>{tokens.length}</strong>
          <small>{totalDownloads} lượt tải đã sử dụng</small>
        </article>
        <article>
          <span>TẢI GẦN NHẤT</span>
          <strong className="overview-date">{lastDownload ? "Đã tải" : "Chưa tải"}</strong>
          <small>{formatDateTime(lastDownload ?? null)}</small>
        </article>
      </section>

      <section className="order-detail-grid">
        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <span>ĐƠN HÀNG</span>
              <h2>{order.order_code}</h2>
            </div>
          </div>
          <dl className="order-detail-list">
            <div>
              <dt>Email khách hàng</dt>
              <dd>{order.customer_email}</dd>
            </div>
            <div>
              <dt>Thời gian tạo</dt>
              <dd>{formatDateTime(order.created_at)}</dd>
            </div>
            <div>
              <dt>Thời gian thanh toán</dt>
              <dd>{formatDateTime(order.paid_at)}</dd>
            </div>
            <div>
              <dt>Tạm tính</dt>
              <dd>{formatOrderAmount(order.subtotal, order.currency)}</dd>
            </div>
            <div>
              <dt>Mã payOS</dt>
              <dd>{order.payos_order_code ?? "Chưa có"}</dd>
            </div>
            <div>
              <dt>Nội dung chuyển khoản</dt>
              <dd>{transferContent || "Chưa có"}</dd>
            </div>
            <div>
              <dt>Payment Link ID</dt>
              <dd className="break-value">{order.payos_payment_link_id ?? "Chưa có"}</dd>
            </div>
          </dl>
          {order.status === "paid" && !isLemonSqueezyOrder ? (
            <form action={updateOrderEmailAndResend} className="order-email-correction">
              <input name="order_id" type="hidden" value={order.id} />
              <input name="return_to" type="hidden" value={returnTo} />
              <label htmlFor="correct-order-email">Sửa email khách hàng</label>
              <p>
                Chỉ thực hiện sau khi đã đối chiếu nội dung chuyển khoản hoặc biên lai. Hệ thống
                sẽ thu hồi toàn bộ link cũ trước khi gửi link mới.
              </p>
              <div>
                <input
                  defaultValue={order.customer_email}
                  id="correct-order-email"
                  name="customer_email"
                  required
                  type="email"
                />
                <button className="primary-button" disabled={!emailReady} type="submit">
                  {emailReady ? "Cập nhật & gửi lại" : "Chưa cấu hình email"}
                </button>
              </div>
            </form>
          ) : null}
        </article>

        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <span>SẢN PHẨM</span>
              <h2>Skill trong đơn</h2>
            </div>
          </div>
          {items.length === 0 ? (
            <div className="order-detail-empty">Đơn hàng chưa có dữ liệu sản phẩm.</div>
          ) : (
            <div className="order-detail-records">
              {items.map((item) => (
                <div className="order-detail-record" key={item.id}>
                  <div>
                    <strong>{item.skill_name}</strong>
                    <span>
                      Phiên bản {item.version} · {item.quantity} × {formatOrderAmount(item.unit_price, order.currency)}
                    </span>
                  </div>
                  <dl className="order-detail-list compact">
                    <div>
                      <dt>Đường dẫn</dt>
                      <dd>{item.skill_slug}</dd>
                    </div>
                    <div>
                      <dt>File bàn giao</dt>
                      <dd className="break-value">{item.file_path ?? "Chưa gắn file"}</dd>
                    </div>
                  </dl>
                  {item.skill_id ? (
                    <Link className="order-detail-inline-link" href={`/admin/skills/${item.skill_id}`}>
                      Mở sản phẩm ↗
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <span>THANH TOÁN</span>
              <h2>Lịch sử thanh toán</h2>
            </div>
          </div>
          {payments.length === 0 ? (
            <div className="order-detail-empty">Chưa nhận được webhook thanh toán.</div>
          ) : (
            <div className="order-detail-records">
              {payments.map((payment) => {
                const normalizedStatus = payment.status.toUpperCase();
                const mismatch = normalizedStatus.includes("MISMATCH");
                return (
                  <div className="order-detail-record payment-record" key={payment.id}>
                    <div>
                      <span className={`token-status ${mismatch ? "expired" : "ready"}`}>
                        {paymentStatusLabel[normalizedStatus] ?? payment.status}
                      </span>
                      <strong>{formatOrderAmount(payment.amount, order.currency)}</strong>
                    </div>
                    <span>{formatDateTime(payment.created_at)}</span>
                    <small>
                      {payment.provider.toUpperCase()} · Mã tham chiếu: {payment.provider_reference ?? "—"}
                    </small>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <span>BÀN GIAO</span>
              <h2>Liên kết tải bảo mật</h2>
            </div>
          </div>
          <p className="order-detail-note">
            Mỗi lần gửi lại email sẽ tạo một liên kết mới. Danh sách này xác nhận link đã được
            tạo; trạng thái giao email chi tiết được kiểm tra trong Resend Logs.
          </p>
          {tokens.length === 0 ? (
            <div className="order-detail-empty">Chưa có liên kết tải nào được tạo.</div>
          ) : (
            <div className="order-detail-records token-records">
              {tokens.map((token, index) => {
                const state = getTokenState(token);
                return (
                  <div className="order-detail-record token-record" key={token.id}>
                    <div>
                      <span className={`token-status ${state.className}`}>{state.label}</span>
                      <strong>Liên kết #{tokens.length - index}</strong>
                    </div>
                    <dl className="order-detail-list compact">
                      <div>
                        <dt>Ngày tạo</dt>
                        <dd>{formatDateTime(token.created_at)}</dd>
                      </div>
                      <div>
                        <dt>Hết hạn</dt>
                        <dd>{formatDateTime(token.expires_at)}</dd>
                      </div>
                      <div>
                        <dt>Lượt tải</dt>
                        <dd>
                          {token.download_count}/{DOWNLOAD_LIMIT} · còn {Math.max(0, DOWNLOAD_LIMIT - token.download_count)}
                        </dd>
                      </div>
                      <div>
                        <dt>Lần tải cuối</dt>
                        <dd>{formatDateTime(token.used_at)}</dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </AdminShell>
  );
}
