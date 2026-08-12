import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin-nav";

export function AdminShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>Skillroom</span></Link>
        <div className="admin-store-label">International store admin</div>
        <AdminNav />
        <div className="admin-sidebar-footer">
          <Link className="back-store" href="/">← View storefront</Link>
          <form action={logout}>
            <button className="logout-button" type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div><span>{eyebrow}</span><h1>{title}</h1></div>
          <span className="demo-chip">Secure area</span>
        </header>
        {children}
      </main>
    </div>
  );
}
