import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/app/admin/login/login-form";
import { hasAdminAuthConfig } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Admin sign in | Skillroom",
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

        <span className="admin-login-eyebrow">Private access</span>
        <h1>Admin sign in</h1>
        <p>Only authorized Skillroom administrators can continue.</p>

        {needsSetup ? (
          <div className="admin-setup-notice">
            Supabase is not configured for this deployment. Add the required
            Vercel environment variables before signing in.
          </div>
        ) : null}

        <LoginForm nextPath={nextPath} />
        <Link className="admin-login-back" href="/">
          ← Back to storefront
        </Link>
      </section>
    </main>
  );
}
