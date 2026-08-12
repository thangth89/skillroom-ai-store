import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="Skillroom home">
          <span className="brand-mark">S</span>
          <span>Skillroom</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/skills">Skill Library</Link>
          <Link href="/support">How it works</Link>
        </nav>
        <Link className="header-cta" href="/skills">
          Explore Skills <span aria-hidden="true">→</span>
        </Link>
      </div>
    </header>
  );
}
