import Link from "next/link";

export function AdminShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/"><span className="brand-mark">S</span><span>Skillroom</span></Link>
        <div className="admin-store-label">Quản trị cửa hàng</div>
        <nav>
          <Link href="/admin">Tổng quan</Link>
          <Link href="/admin/skills">Sản phẩm</Link>
          <Link href="/admin/orders">Đơn hàng</Link>
          <Link href="/admin/settings">Cài đặt</Link>
        </nav>
        <Link className="back-store" href="/">← Về cửa hàng</Link>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div><span>{eyebrow}</span><h1>{title}</h1></div>
          <span className="demo-chip">Bản cấu trúc</span>
        </header>
        {children}
      </main>
    </div>
  );
}
