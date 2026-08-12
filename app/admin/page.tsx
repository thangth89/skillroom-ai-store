import { AdminShell } from "@/components/admin-shell";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { formatUsdCents } from "@/lib/format";
import {
  createAdminClient,
  hasAdminDataConfig,
  requireAdmin,
} from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PaidOrderTotal = {
  total: number;
};

async function getAdminOrderStats() {
  const supabase = createAdminClient();
  const [{ count: totalOrders, error: countError }, { data: paidOrders, error: paidError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .neq("currency", "VND"),
      supabase
        .from("orders")
        .select("total")
        .eq("status", "paid")
        .eq("currency", "USD")
        .returns<PaidOrderTotal[]>(),
    ]);

  const error = countError ?? paidError;
  const paid = paidOrders ?? [];

  return {
    total: totalOrders ?? 0,
    paid: paid.length,
    revenue: paid.reduce((sum, order) => sum + order.total, 0),
    error,
  };
}

async function getInternationalSkillStats() {
  const supabase = createAdminClient();
  const [allResult, publishedResult] = await Promise.all([
    supabase
      .from("skills")
      .select("id", { count: "exact", head: true })
      .not("name_en", "is", null)
      .neq("name_en", ""),
    supabase
      .from("skills")
      .select("id", { count: "exact", head: true })
      .not("name_en", "is", null)
      .neq("name_en", "")
      .eq("status", "published"),
  ]);

  return {
    total: allResult.count ?? 0,
    published: publishedResult.count ?? 0,
    error: allResult.error ?? publishedResult.error,
  };
}

export default async function AdminPage() {
  await requireAdmin();

  const dataReady = hasAdminDataConfig();
  const [skillStats, orderStats] = dataReady
    ? await Promise.all([getInternationalSkillStats(), getAdminOrderStats()])
    : [
        { total: 0, published: 0, error: new Error("Missing configuration") },
        { total: 0, paid: 0, revenue: 0, error: new Error("Missing configuration") },
      ];

  const lemonReady = Boolean(process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  const emailReady = hasEmailDeliveryConfig();
  const supabaseReady = !skillStats.error && !orderStats.error;

  return (
    <AdminShell eyebrow="INTERNATIONAL STORE" title="Overview">
      <section className="admin-stats">
        <article>
          <span>Published Skills</span>
          <strong>{skillStats.error ? "—" : skillStats.published}</strong>
          <small>
            {skillStats.error
              ? "Unable to load Skill data"
              : `${skillStats.total} Skills prepared for the international store`}
          </small>
        </article>
        <article>
          <span>Paid international orders</span>
          <strong>{orderStats.error ? "—" : orderStats.paid}</strong>
          <small>
            {orderStats.error
              ? "Unable to load order data"
              : `${orderStats.total} international orders recorded`}
          </small>
        </article>
        <article>
          <span>USD revenue</span>
          <strong>{orderStats.error ? "—" : formatUsdCents(orderStats.revenue)}</strong>
          <small>Paid USD orders recorded through the international checkout</small>
        </article>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>SYSTEM STATUS</span>
            <h2>International store connections</h2>
          </div>
        </div>
        <div className="integration-list">
          <div>
            <span className="status ready">Ready</span>
            <strong>International storefront</strong>
            <small>Catalog, product pages and checkout</small>
          </div>
          <div>
            <span className={`status ${lemonReady ? "ready" : "pending"}`}>
              {lemonReady ? "Connected" : "Configuration required"}
            </span>
            <strong>Lemon Squeezy</strong>
            <small>Global checkout and payment webhooks</small>
          </div>
          <div>
            <span className={`status ${emailReady ? "ready" : "pending"}`}>
              {emailReady ? "Connected" : "Configuration required"}
            </span>
            <strong>Resend</strong>
            <small>Free Skill delivery and support email</small>
          </div>
          <div>
            <span className={`status ${supabaseReady ? "ready" : "pending"}`}>
              {supabaseReady ? "Connected" : "Check configuration"}
            </span>
            <strong>Supabase</strong>
            <small>Shared catalog, international orders and private files</small>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
