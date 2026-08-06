import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/app/admin/login/login-form";
import { hasAdminAuthConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Đăng nhập quản trị | Skillroom",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    setup?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const needsSetup = params.setup === "required" || !hasAdminAuthConfig();
  const nextPath =
    params.next?.startsWith("/admin") && !params.next.startsWith("//")
      ? params.next
      : "/admin";

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <Link className="brand" href="/">
          <span className="brand-mark">S</span>
          <span>Skillroom</span>
        </Link>

        <span className="admin-login-eyebrow">Khu vực riêng tư</span>
        <h1>Đăng nhập quản trị</h1>
        <p>Chỉ tài khoản admin được cấp quyền mới có thể truy cập.</p>

        {needsSetup ? (
          <div className="admin-setup-notice">
            Chưa cấu hình Supabase. Hãy làm theo tài liệu thiết lập và thêm biến
            môi trường trên Vercel trước khi đăng nhập.
          </div>
        ) : null}

        <LoginForm nextPath={nextPath} />
        <Link className="admin-login-back" href="/">
          ← Quay lại cửa hàng
        </Link>
      </section>
    </main>
  );
}
