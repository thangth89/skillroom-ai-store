import { AdminShell } from "@/components/admin-shell";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { hasPayOSConfig } from "@/lib/payos";
import { hasAdminDataConfig, requireAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function getProjectHost() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!projectUrl) return "Chưa xác định";

  try {
    return new URL(projectUrl).hostname;
  } catch {
    return "Đã khai báo";
  }
}

async function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (configuredUrl) return configuredUrl;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  return host ? `${protocol}://${host}` : "Chưa xác định tên miền";
}

export default async function AdminSettingsPage() {
  await requireAdmin();

  const payOSReady = hasPayOSConfig();
  const emailReady = hasEmailDeliveryConfig();
  const supabaseReady = hasAdminDataConfig();
  const siteUrl = await getSiteUrl();
  const sender = process.env.EMAIL_FROM ?? "Chưa khai báo EMAIL_FROM";
  const bucket = process.env.SKILL_STORAGE_BUCKET ?? "Chưa khai báo bucket";

  return (
    <AdminShell eyebrow="HỆ THỐNG" title="Cài đặt">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>QUẢN LÝ AN TOÀN</span>
            <h2>Trạng thái cấu hình máy chủ</h2>
          </div>
        </div>
        <p className="settings-security-note">
          Trang này chỉ kiểm tra hệ thống đã được cấu hình hay chưa. API Key và khóa bí mật
          vẫn được quản lý trong Environment Variables của Vercel và không bao giờ hiển thị
          tại đây.
        </p>
      </section>

      <section className="settings-grid">
        <article className="admin-panel">
          <span className="section-index">THANH TOÁN</span>
          <h2>payOS / VietQR</h2>
          <span className={`status ${payOSReady ? "ready" : "pending"}`}>
            {payOSReady ? "Đã kết nối" : "Thiếu cấu hình"}
          </span>
          <p>
            {payOSReady
              ? "Đã đủ Client ID, API Key và Checksum Key để tạo QR và xác minh giao dịch."
              : "Cần kiểm tra lại ba biến môi trường payOS trên Vercel."}
          </p>
          <small className="settings-value">
            Webhook: {siteUrl}/api/payments/payos/webhook
          </small>
          <a
            className="secondary-button"
            href="https://my.payos.vn"
            rel="noreferrer"
            target="_blank"
          >
            Mở payOS ↗
          </a>
        </article>

        <article className="admin-panel">
          <span className="section-index">EMAIL</span>
          <h2>Resend</h2>
          <span className={`status ${emailReady ? "ready" : "pending"}`}>
            {emailReady ? "Đã kết nối" : "Thiếu cấu hình"}
          </span>
          <p>
            {emailReady
              ? "Website đã sẵn sàng gửi email bàn giao và liên kết tải Skill."
              : "Cần kiểm tra RESEND_API_KEY và EMAIL_FROM trên Vercel."}
          </p>
          <small className="settings-value">Người gửi: {sender}</small>
          <a
            className="secondary-button"
            href="https://resend.com/domains"
            rel="noreferrer"
            target="_blank"
          >
            Mở Resend ↗
          </a>
        </article>

        <article className="admin-panel">
          <span className="section-index">DỮ LIỆU &amp; FILE</span>
          <h2>Supabase</h2>
          <span className={`status ${supabaseReady ? "ready" : "pending"}`}>
            {supabaseReady ? "Đã kết nối" : "Thiếu cấu hình"}
          </span>
          <p>
            {supabaseReady
              ? "Database và kho file riêng tư đã sẵn sàng cho đơn hàng thật."
              : "Cần kiểm tra URL, Secret Key và tên bucket trên Vercel."}
          </p>
          <small className="settings-value">
            Dự án: {getProjectHost()} · Bucket: {bucket}
          </small>
          <a
            className="secondary-button"
            href="https://supabase.com/dashboard"
            rel="noreferrer"
            target="_blank"
          >
            Mở Supabase ↗
          </a>
        </article>
      </section>
    </AdminShell>
  );
}
