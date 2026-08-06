import { AdminShell } from "@/components/admin-shell";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { formatVnd } from "@/lib/format";
import { hasPayOSConfig } from "@/lib/payos";
import {
  createAdminClient,
  hasAdminDataConfig,
  requireAdmin,
} from "@/lib/supabase/admin";
import { getAdminSkillStats } from "@/lib/supabase/skill-records";

export const dynamic = "force-dynamic";

type PaidOrderTotal = {
  total: number;
};

async function getAdminOrderStats() {
  const supabase = createAdminClient();
  const [{ count: totalOrders, error: countError }, { data: paidOrders, error: paidError }] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("total")
        .eq("status", "paid")
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

export default async function AdminPage() {
  await requireAdmin();

  const dataReady = hasAdminDataConfig();
  const [skillStats, orderStats] = dataReady
    ? await Promise.all([getAdminSkillStats(), getAdminOrderStats()])
    : [
        { total: 0, published: 0, error: new Error("Thiếu cấu hình") },
        { total: 0, paid: 0, revenue: 0, error: new Error("Thiếu cấu hình") },
      ];

  const payOSReady = hasPayOSConfig();
  const emailReady = hasEmailDeliveryConfig();
  const supabaseReady = !skillStats.error && !orderStats.error;

  return (
    <AdminShell eyebrow="HÔM NAY" title="Tổng quan">
      <section className="admin-stats">
        <article>
          <span>Skill đang bán</span>
          <strong>{skillStats.error ? "—" : skillStats.published}</strong>
          <small>
            {skillStats.error
              ? "Không thể đọc dữ liệu Skill"
              : `${skillStats.total} Skill trong hệ thống`}
          </small>
        </article>
        <article>
          <span>Đơn đã thanh toán</span>
          <strong>{orderStats.error ? "—" : orderStats.paid}</strong>
          <small>
            {orderStats.error
              ? "Không thể đọc dữ liệu đơn hàng"
              : `${orderStats.total} đơn hàng đã được tạo`}
          </small>
        </article>
        <article>
          <span>Doanh thu</span>
          <strong>{orderStats.error ? "—" : formatVnd(orderStats.revenue)}</strong>
          <small>Chỉ tính các đơn đã được payOS xác nhận</small>
        </article>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>TRẠNG THÁI HỆ THỐNG</span>
            <h2>Các kết nối đang vận hành</h2>
          </div>
        </div>
        <div className="integration-list">
          <div>
            <span className="status ready">Sẵn sàng</span>
            <strong>Giao diện cửa hàng</strong>
            <small>Danh sách, chi tiết và checkout</small>
          </div>
          <div>
            <span className={`status ${payOSReady ? "ready" : "pending"}`}>
              {payOSReady ? "Đã kết nối" : "Thiếu cấu hình"}
            </span>
            <strong>payOS</strong>
            <small>Tạo VietQR và xác nhận thanh toán</small>
          </div>
          <div>
            <span className={`status ${emailReady ? "ready" : "pending"}`}>
              {emailReady ? "Đã kết nối" : "Thiếu cấu hình"}
            </span>
            <strong>Resend</strong>
            <small>Gửi email bàn giao Skill</small>
          </div>
          <div>
            <span className={`status ${supabaseReady ? "ready" : "pending"}`}>
              {supabaseReady ? "Đã kết nối" : "Cần kiểm tra"}
            </span>
            <strong>Supabase</strong>
            <small>Dữ liệu đơn hàng và kho file riêng tư</small>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
