import { AdminShell } from "@/components/admin-shell";

export default function AdminOrdersPage() { return <AdminShell eyebrow="BÁN HÀNG" title="Đơn hàng"><section className="admin-panel empty-panel"><div className="empty-mark">↗</div><h2>Đơn hàng sẽ xuất hiện tại đây.</h2><p>Sau khi kết nối Supabase và webhook payOS, bạn có thể lọc theo trạng thái chờ thanh toán, đã trả tiền, đã gửi email hoặc cần xử lý.</p></section></AdminShell>; }
