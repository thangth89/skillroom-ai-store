import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { formatOrderAmount } from "@/lib/format";
import type { OrderStatus } from "@/lib/orders";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
  expired: "Expired",
  refunded: "Refunded",
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
  return (
    order.order_code.toLowerCase().includes(normalizedTerm) ||
    order.customer_email.toLowerCase().includes(normalizedTerm)
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ delivery?: string; q?: string }>;
}) {
  await requireAdmin();
  const query = await searchParams;
  const searchTerm = query.q?.trim().slice(0, 120) ?? "";
  const supabase = createAdminClient();
  const result = await supabase
    .from("orders")
    .select("id, order_code, customer_email, status, total, currency, created_at")
    .neq("currency", "VND")
    .order("created_at", { ascending: false })
    .limit(searchTerm.length >= 2 ? 500 : 100)
    .returns<AdminOrder[]>();
  let orders = result.data ?? [];
  const error = result.error;
  if (searchTerm.length >= 2) {
    orders = orders.filter((order) => matchesOrderSearch(order, searchTerm));
  }

  return (
    <AdminShell eyebrow="INTERNATIONAL SALES" title="Orders">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>
              {orders.length} {searchTerm.length >= 2 ? "RESULTS" : "RECENT ORDERS"}
            </span>
            <h2>Lemon Squeezy payments</h2>
          </div>
        </div>
        <form className="admin-order-search" method="get">
          <label htmlFor="order-search">Find an international order</label>
          <div>
            <input
              defaultValue={searchTerm}
              id="order-search"
              minLength={2}
              name="q"
              placeholder="Lemon Squeezy order code or customer email"
              type="search"
            />
            <button className="primary-button" type="submit">Search</button>
            {searchTerm ? <Link className="secondary-button" href="/admin/orders">Clear search</Link> : null}
          </div>
          <small>Search by the LS order code recorded from the webhook or by customer email.</small>
        </form>
        {query.delivery === "sent" ? (
          <div className="admin-form-success">The delivery email was sent again.</div>
        ) : null}
        {query.delivery === "config" ? (
          <div className="admin-form-error">
            RESEND_API_KEY and EMAIL_FROM are not configured on Vercel.
          </div>
        ) : null}
        {query.delivery === "error" ? (
          <div className="admin-form-error">
            The email could not be sent. Check Resend Logs and the environment variables.
          </div>
        ) : null}
        {query.delivery === "invalid" ? (
          <div className="admin-form-error">The order code is invalid.</div>
        ) : null}
        {error ? (
          <div className="admin-form-error">Unable to load orders: {error.message}</div>
        ) : null}
        {!error && orders.length === 0 ? (
          <div className="admin-list-empty">
            <strong>{searchTerm ? "No matching order found." : "No international orders yet."}</strong>
            <p>{searchTerm ? "Check the Lemon Squeezy order code or customer email." : "A new order appears here after the Lemon Squeezy order_created webhook succeeds."}</p>
          </div>
        ) : null}
        {orders.length > 0 ? (
          <div className="admin-table">
            <div className="table-row order-table-row table-head">
              <span>Order</span>
              <span>Email</span>
              <span>Total</span>
              <span>Status</span>
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
                    {new Date(order.created_at).toLocaleString("en-US", {
                      timeZone: "UTC",
                    })}
                  </small>
                </span>
                <span>{order.customer_email}</span>
                <span>{formatOrderAmount(order.total, order.currency)}</span>
                <span className="order-status-actions">
                  <i className={`order-status ${order.status}`}>{statusLabel[order.status]}</i>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
