import { AdminShell } from "@/components/admin-shell";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { formatUsdCents, formatVnd } from "@/lib/format";
import { getInternationalPaymentProvider, isInternationalCheckoutLive } from "@/lib/international-payments";
import { hasPayOSConfig } from "@/lib/payos";
import { createAdminClient, hasAdminDataConfig, requireAdmin } from "@/lib/supabase/admin";
import { getAdminSkillStats } from "@/lib/supabase/skill-records";

export const dynamic = "force-dynamic";

type PaidOrderTotal = { total: number; currency: string };

async function getOrderStats() {
  const supabase = createAdminClient();
  const [{ count, error: countError }, { data, error: paidError }] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("total,currency").eq("status", "paid").returns<PaidOrderTotal[]>(),
  ]);
  const paid = data ?? [];
  return {
    total: count ?? 0,
    paid: paid.length,
    revenueVnd: paid.filter((order) => order.currency === "VND").reduce((sum, order) => sum + order.total, 0),
    revenueUsd: paid.filter((order) => order.currency === "USD").reduce((sum, order) => sum + order.total, 0),
    error: countError ?? paidError,
  };
}

export default async function AdminPage() {
  await requireAdmin();
  const dataReady = hasAdminDataConfig();
  const [skillStats, orderStats] = dataReady
    ? await Promise.all([getAdminSkillStats(), getOrderStats()])
    : [{ total: 0, published: 0, error: new Error("Missing configuration") }, { total: 0, paid: 0, revenueVnd: 0, revenueUsd: 0, error: new Error("Missing configuration") }];
  const provider = getInternationalPaymentProvider();
  const internationalReady = isInternationalCheckoutLive();
  const emailReady = hasEmailDeliveryConfig();
  const payosReady = hasPayOSConfig();
  const supabaseReady = !skillStats.error && !orderStats.error;

  return (
    <AdminShell eyebrow="TỔNG QUAN CỬA HÀNG" title="Tổng quan">
      <section className="admin-stats">
        <article><span>Skill đang bán</span><strong>{skillStats.error ? "—" : skillStats.published}</strong><small>{skillStats.error ? "Không thể đọc dữ liệu" : `${skillStats.total} Skill trong hệ thống`}</small></article>
        <article><span>Đơn đã thanh toán</span><strong>{orderStats.error ? "—" : orderStats.paid}</strong><small>{orderStats.error ? "Không thể đọc đơn hàng" : `${orderStats.total} đơn từ mọi thị trường`}</small></article>
        <article><span>Doanh thu Việt Nam</span><strong>{orderStats.error ? "—" : formatVnd(orderStats.revenueVnd)}</strong><small>Đơn VND đã thanh toán</small></article>
        <article><span>Doanh thu quốc tế</span><strong>{orderStats.error ? "—" : formatUsdCents(orderStats.revenueUsd)}</strong><small>Đơn USD đã thanh toán</small></article>
      </section>

      <section className="admin-panel">
        <div className="panel-heading"><div><span>TRẠNG THÁI HỆ THỐNG</span><h2>Kết nối đang sử dụng</h2></div></div>
        <div className="integration-list">
          <div><span className={`status ${payosReady ? "ready" : "pending"}`}>{payosReady ? "Đã kết nối" : "Cần cấu hình"}</span><strong>payOS / VietQR</strong><small>Thanh toán khách hàng Việt Nam</small></div>
          <div><span className={`status ${internationalReady ? "ready" : "pending"}`}>{internationalReady ? "Đang hoạt động" : "Tạm tắt an toàn"}</span><strong>{provider}</strong><small>{internationalReady ? "Thanh toán quốc tế đã mở" : "Chưa có nhà cung cấp quốc tế được duyệt; khách không thể thanh toán nhầm"}</small></div>
          <div><span className={`status ${emailReady ? "ready" : "pending"}`}>{emailReady ? "Đã kết nối" : "Cần cấu hình"}</span><strong>Resend</strong><small>Gửi Skill miễn phí và liên kết bàn giao</small></div>
          <div><span className={`status ${supabaseReady ? "ready" : "pending"}`}>{supabaseReady ? "Đã kết nối" : "Kiểm tra cấu hình"}</span><strong>Supabase</strong><small>Danh mục, đơn hàng và file riêng tư dùng chung</small></div>
        </div>
      </section>
    </AdminShell>
  );
}
