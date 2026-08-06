import { AdminShell } from "@/components/admin-shell";
import { hasAdminDataConfig, requireAdmin } from "@/lib/supabase/admin";
import { getAdminSkillStats } from "@/lib/supabase/skill-records";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const stats = hasAdminDataConfig()
    ? await getAdminSkillStats()
    : { total: 0, published: 0, error: new Error("Thiếu cấu hình") };

  return <AdminShell eyebrow="HÔM NAY" title="Tổng quan"><section className="admin-stats"><article><span>Skill đang bán</span><strong>{stats.error ? "—" : stats.published}</strong><small>{stats.error ? "Chưa đọc được Supabase" : `${stats.total} sản phẩm thật trong dữ liệu`}</small></article><article><span>Đơn đã thanh toán</span><strong>—</strong><small>Chờ kết nối payOS</small></article><article><span>Doanh thu</span><strong>—</strong><small>Chờ webhook payOS</small></article></section><section className="admin-panel"><div className="panel-heading"><div><span>LUỒNG HỆ THỐNG</span><h2>Các kết nối cần hoàn thiện</h2></div></div><div className="integration-list"><div><span className="status ready">Sẵn sàng</span><strong>Giao diện cửa hàng</strong><small>Danh sách, chi tiết, checkout</small></div><div><span className="status pending">Chờ khóa</span><strong>payOS</strong><small>API tạo QR và webhook</small></div><div><span className="status pending">Chờ khóa</span><strong>Resend</strong><small>Gửi email bàn giao</small></div><div><span className={stats.error ? "status pending" : "status ready"}>{stats.error ? "Cần kiểm tra" : "Đã kết nối"}</span><strong>Supabase</strong><small>Dữ liệu Skill và file riêng tư</small></div></div></section></AdminShell>;
}
