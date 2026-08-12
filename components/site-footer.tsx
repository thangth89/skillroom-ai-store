import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark">S</span>
            <span>Skillroom</span>
          </Link>
          <p className="footer-note">Video-verified AI Skills, delivered securely to your inbox.</p>
        </div>
        <div className="footer-links">
          <p>Products</p>
          <Link href="/skills">Skill Library</Link>
          <Link href="/support">How it works</Link>
        </div>
        <div className="footer-links">
          <p>Information</p>
          <Link href="/legal/terms">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Skillroom</span>
        <span>Digital products • Delivered by email</span>
      </div>
    </footer>
  );
}
