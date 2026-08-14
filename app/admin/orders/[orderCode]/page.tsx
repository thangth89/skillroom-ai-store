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
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
};

const paymentStatusLabel: Record<string, string> = {
  PAID: "Confirmed",
  AMOUNT_MISMATCH: "Amount mismatch",
  REFUNDED: "Refunded",
};

function formatDateTime(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function getTokenState(token: AdminDownloadToken) {
  if (token.download_count >= DOWNLOAD_LIMIT) {
    return { className: "exhausted", label: "Limit reached" };
  }
  if (new Date(token.expires_at).getTime() <= Date.now()) {
    return { className: "expired", label: "Expired" };
  }
  return { className: "ready", label: "Active" };
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
  const deliveryManagedBySite = items.some((item) => Boolean(item.file_path));
  const paymentProvider = payments[0]?.provider || (order.currency === "VND" ? "payOS" : "Chưa ghi nhận");
  const totalDownloads = tokens.reduce((sum, token) => sum + token.download_count, 0);
  const lastDownload = tokens
    .map((token) => token.used_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return (
    <AdminShell eyebrow="INTERNATIONAL SALES" title="Order details">
      <div className="order-detail-toolbar">
        <Link className="back-link" href="/admin/orders">
          ← Back to orders
        </Link>
        <div className="order-detail-actions">
          <CopyValueButton label="Copy order code" value={order.order_code} />
          <CopyValueButton label="Copy email" value={order.customer_email} />
          {transferContent ? (
            <CopyValueButton label="Copy payment reference" value={transferContent} />
          ) : null}
          <a className="secondary-button" href={`mailto:${order.customer_email}`}>
            Email customer
          </a>
          {order.checkout_url ? (
            <a
              className="secondary-button"
              href={order.checkout_url}
              rel="noreferrer"
              target="_blank"
            >
              Mở biên nhận ↗
            </a>
          ) : null}
          {order.status === "paid" && deliveryManagedBySite ? (
            <form action={resendOrderEmail}>
              <input name="order_id" type="hidden" value={order.id} />
              <input name="return_to" type="hidden" value={returnTo} />
              <button className="primary-button" disabled={!emailReady} type="submit">
                {emailReady ? "Create new link & email" : "Email not configured"}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {query.delivery === "sent" ? (
        <div className="admin-form-success">
          A new download link was created and emailed to {order.customer_email}.
        </div>
      ) : null}
      {query.delivery === "config" ? (
        <div className="admin-form-error">
          RESEND_API_KEY and EMAIL_FROM are not configured on Vercel.
        </div>
      ) : null}
      {query.delivery === "error" ? (
        <div className="admin-form-error">
          The email could not be sent. Check Resend Logs and server configuration.
        </div>
      ) : null}
      {query.delivery === "invalid" ? (
        <div className="admin-form-error">The order code is invalid.</div>
      ) : null}
      {query.delivery === "corrected" ? (
        <div className="admin-form-success">
          The email was updated, old links were revoked and a new link was sent to {order.customer_email}.
        </div>
      ) : null}
      {query.delivery === "email_invalid" ? (
        <div className="admin-form-error">The new email or order code is invalid.</div>
      ) : null}
      {query.delivery === "email_update_error" ? (
        <div className="admin-form-error">The order email could not be updated.</div>
      ) : null}
      {query.delivery === "not_paid" ? (
        <div className="admin-form-error">Email correction is only available for paid orders.</div>
      ) : null}
      {query.delivery === "security_error" ? (
        <div className="admin-form-error">
          The email was changed, but the old link could not be revoked. Check Supabase before delivering the file again.
        </div>
      ) : null}
      {query.delivery === "email_saved_config" ? (
        <div className="admin-form-error">
          The email was changed and old links were revoked, but Resend is not configured on Vercel.
        </div>
      ) : null}
      {query.delivery === "email_saved_error" ? (
        <div className="admin-form-error">
          The email was changed and old links were revoked, but the new email failed. Check Resend Logs and try again.
        </div>
      ) : null}
      {error ? (
        <div className="admin-form-error">Some order data could not be loaded: {error.message}</div>
      ) : null}
      {amountMismatch ? (
        <div className="order-detail-warning">
          A payment does not match the order total. Check the payment provider before delivering any file.
        </div>
      ) : null}

      <section className="order-detail-overview">
        <article>
          <span>STATUS</span>
          <i className={`order-status ${order.status}`}>{statusLabel[order.status]}</i>
          <small>Updated {formatDateTime(order.updated_at)} UTC</small>
        </article>
        <article>
          <span>ORDER TOTAL</span>
          <strong>{formatOrderAmount(order.total, order.currency)}</strong>
          <small>{order.currency}</small>
        </article>
        <article>
          <span>DOWNLOAD LINKS</span>
          <strong>{tokens.length}</strong>
          <small>{totalDownloads} downloads used</small>
        </article>
        <article>
          <span>LATEST DOWNLOAD</span>
          <strong className="overview-date">{lastDownload ? "Downloaded" : "Not downloaded"}</strong>
          <small>{formatDateTime(lastDownload ?? null)}{lastDownload ? " UTC" : ""}</small>
        </article>
      </section>

      <section className="order-detail-grid">
        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <span>ORDER</span>
              <h2>{order.order_code}</h2>
            </div>
          </div>
          <dl className="order-detail-list">
            <div>
              <dt>Customer email</dt>
              <dd>{order.customer_email}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(order.created_at)}</dd>
            </div>
            <div>
              <dt>Paid</dt>
              <dd>{formatDateTime(order.paid_at)}</dd>
            </div>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatOrderAmount(order.subtotal, order.currency)}</dd>
            </div>
            <div>
              <dt>Payment provider</dt>
              <dd>{paymentProvider}</dd>
            </div>
            <div>
              <dt>Payment reference</dt>
              <dd>{transferContent || "See payment history"}</dd>
            </div>
            <div>
              <dt>Receipt</dt>
              <dd className="break-value">
                {order.checkout_url ? (
                  <a href={order.checkout_url} rel="noreferrer" target="_blank">Open receipt ↗</a>
                ) : "Not available"}
              </dd>
            </div>
          </dl>
          {order.status === "paid" && deliveryManagedBySite ? (
            <form action={updateOrderEmailAndResend} className="order-email-correction">
              <input name="order_id" type="hidden" value={order.id} />
              <input name="return_to" type="hidden" value={returnTo} />
              <label htmlFor="correct-order-email">Correct customer email</label>
              <p>
                Only continue after verifying the payment receipt. The system revokes every old
                link before sending a new one.
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
                  {emailReady ? "Update & resend" : "Email not configured"}
                </button>
              </div>
            </form>
          ) : null}
        </article>

        <article className="admin-panel">
          <div className="panel-heading">
            <div>
              <span>PRODUCTS</span>
              <h2>Skills in this order</h2>
            </div>
          </div>
          {items.length === 0 ? (
            <div className="order-detail-empty">No product data is attached to this order.</div>
          ) : (
            <div className="order-detail-records">
              {items.map((item) => (
                <div className="order-detail-record" key={item.id}>
                  <div>
                    <strong>{item.skill_name}</strong>
                    <span>
                      Version {item.version} · {item.quantity} × {formatOrderAmount(item.unit_price, order.currency)}
                    </span>
                  </div>
                  <dl className="order-detail-list compact">
                    <div>
                      <dt>Slug</dt>
                      <dd>{item.skill_slug}</dd>
                    </div>
                    <div>
                      <dt>Delivery file</dt>
                      <dd className="break-value">{item.file_path ?? "Do nhà cung cấp thanh toán quản lý"}</dd>
                    </div>
                  </dl>
                  {item.skill_id ? (
                    <Link className="order-detail-inline-link" href={`/admin/skills/${item.skill_id}`}>
                      Open Skill ↗
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
              <span>PAYMENT</span>
              <h2>Payment history</h2>
            </div>
          </div>
          {payments.length === 0 ? (
            <div className="order-detail-empty">No payment webhook has been recorded.</div>
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
                      {payment.provider.toUpperCase()} · Reference: {payment.provider_reference ?? "—"}
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
              <span>DELIVERY</span>
              <h2>Secure download links</h2>
            </div>
          </div>
          <p className="order-detail-note">
            Liên kết tải Skillroom xuất hiện tại đây khi website trực tiếp bàn giao file.
            Nếu nhà cung cấp thanh toán quản lý file, hãy kiểm tra biên nhận của nhà cung cấp.
          </p>
          {tokens.length === 0 ? (
            <div className="order-detail-empty">No Skillroom download link has been created.</div>
          ) : (
            <div className="order-detail-records token-records">
              {tokens.map((token, index) => {
                const state = getTokenState(token);
                return (
                  <div className="order-detail-record token-record" key={token.id}>
                    <div>
                      <span className={`token-status ${state.className}`}>{state.label}</span>
                      <strong>Link #{tokens.length - index}</strong>
                    </div>
                    <dl className="order-detail-list compact">
                      <div>
                        <dt>Created</dt>
                        <dd>{formatDateTime(token.created_at)}</dd>
                      </div>
                      <div>
                        <dt>Expires</dt>
                        <dd>{formatDateTime(token.expires_at)}</dd>
                      </div>
                      <div>
                        <dt>Downloads</dt>
                        <dd>
                          {token.download_count}/{DOWNLOAD_LIMIT} · {Math.max(0, DOWNLOAD_LIMIT - token.download_count)} remaining
                        </dd>
                      </div>
                      <div>
                        <dt>Last download</dt>
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
