import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="Skillroom - Trang chủ">
          <span className="brand-mark">S</span>
          <span>Skillroom</span>
        </Link>
        <nav className="main-nav" aria-label="Điều hướng chính">
          <Link href="/skills">Kho Skill</Link>
          <Link href="/support">Hướng dẫn</Link>
        </nav>
        <Link className="header-cta" href="/skills">
          Khám phá Skill <span aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  );
}
