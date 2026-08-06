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
          <p className="footer-note">Skill AI được kiểm thử bằng video, giao tự động sau thanh toán.</p>
        </div>
        <div className="footer-links">
          <p>Sản phẩm</p>
          <Link href="/skills">Kho Skill</Link>
          <Link href="/support">Cách sử dụng</Link>
        </div>
        <div className="footer-links">
          <p>Thông tin</p>
          <Link href="/legal/terms">Điều khoản</Link>
          <Link href="/legal/privacy">Bảo mật</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Skillroom</span>
        <span>Sản phẩm số • Giao qua email</span>
      </div>
    </footer>
  );
}
