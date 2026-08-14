import { headers } from "next/headers";
import { AdminShell } from "@/components/admin-shell";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { getInternationalPaymentProvider, isInternationalCheckoutLive } from "@/lib/international-payments";
import { hasPayOSConfig } from "@/lib/payos";
import { hasAdminDataConfig, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function getProjectHost() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!projectUrl) return "Chưa cấu hình";
  try { return new URL(projectUrl).hostname; } catch { return "Đã cấu hình"; }
}

async function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}` : "Chưa xác định URL";
}

export default async function AdminSettingsPage() {
  await requireAdmin();
  const payosReady = hasPayOSConfig();
  const internationalReady = isInternationalCheckoutLive();
  const provider = getInternationalPaymentProvider();
  const emailReady = hasEmailDeliveryConfig();
  const supabaseReady = hasAdminDataConfig();
  const siteUrl = await getSiteUrl();
  const sender = process.env.EMAIL_FROM ?? "Chưa cấu hình EMAIL_FROM";
  const bucket = process.env.SKILL_STORAGE_BUCKET ?? "Chưa cấu hình bucket";

  return (
    <AdminShell eyebrow="HỆ THỐNG" title="Cài đặt">
      <section className="admin-panel">
        <div className="panel-heading"><div><span>CẤU HÌNH BẢO MẬT</span><h2>Trạng thái biến môi trường</h2></div></div>
        <p className="settings-security-note">Trang này chỉ hiển thị trạng thái kết nối. Khóa API và chuỗi bí mật vẫn nằm trong Vercel Environment Variables và không bao giờ được công khai.</p>
      </section>

      <section className="settings-grid">
        <article className="admin-panel">
          <span className="section-index">THANH TOÁN VIỆT NAM</span><h2>payOS / VietQR</h2>
          <span className={`status ${payosReady ? "ready" : "pending"}`}>{payosReady ? "Đã kết nối" : "Cần cấu hình"}</span>
          <p>{payosReady ? "Khách Việt Nam có thể tạo mã VietQR và nhận Skill sau khi payOS xác nhận." : "Kiểm tra PAYOS_CLIENT_ID, PAYOS_API_KEY và PAYOS_CHECKSUM_KEY."}</p>
          <small className="settings-value">Webhook: {siteUrl}/api/payments/payos/webhook</small>
        </article>

        <article className="admin-panel">
          <span className="section-index">THANH TOÁN QUỐC TẾ</span><h2>{provider}</h2>
          <span className={`status ${internationalReady ? "ready" : "pending"}`}>{internationalReady ? "Đang hoạt động" : "Tạm tắt an toàn"}</span>
          <p>{internationalReady ? "Checkout quốc tế đang được cho phép trên website." : "Lemon không được duyệt nên thanh toán quốc tế đang tắt. Khi có nhà cung cấp mới, thêm URL sản phẩm rồi bật INTERNATIONAL_CHECKOUT_ENABLED."}</p>
          <small className="settings-value">Provider: {process.env.INTERNATIONAL_PAYMENT_PROVIDER || "Chưa chọn"}</small>
        </article>

        <article className="admin-panel">
          <span className="section-index">EMAIL</span><h2>Resend</h2>
          <span className={`status ${emailReady ? "ready" : "pending"}`}>{emailReady ? "Đã kết nối" : "Cần cấu hình"}</span>
          <p>{emailReady ? "Website có thể gửi Skill miễn phí và liên kết bàn giao cho cả hai thị trường." : "Kiểm tra RESEND_API_KEY và EMAIL_FROM trên Vercel."}</p>
          <small className="settings-value">Người gửi: {sender}</small>
          <a className="secondary-button" href="https://resend.com/domains" rel="noreferrer" target="_blank">Mở Resend ↗</a>
        </article>

        <article className="admin-panel">
          <span className="section-index">DỮ LIỆU &amp; FILE</span><h2>Supabase</h2>
          <span className={`status ${supabaseReady ? "ready" : "pending"}`}>{supabaseReady ? "Đã kết nối" : "Cần cấu hình"}</span>
          <p>{supabaseReady ? "Cơ sở dữ liệu và kho file Skill riêng tư đang dùng chung cho VN/EN." : "Kiểm tra Supabase URL, Secret Key và bucket trên Vercel."}</p>
          <small className="settings-value">Dự án: {getProjectHost()} · Bucket: {bucket}</small>
          <a className="secondary-button" href="https://supabase.com/dashboard" rel="noreferrer" target="_blank">Mở Supabase ↗</a>
        </article>
      </section>
    </AdminShell>
  );
}
