import Link from "next/link";
import { getStoreLocale } from "@/lib/locale";

export async function SiteFooter() {
  const locale = await getStoreLocale();
  const vi = locale === "vi";

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark">S</span>
            <span>Skillroom</span>
          </Link>
          <p className="footer-note">
            {vi
              ? "Skill AI được kiểm thử bằng video, giao tự động sau thanh toán."
              : "Video-verified AI Skills, delivered securely to your inbox."}
          </p>
        </div>
        <div className="footer-links">
          <p>{vi ? "Sản phẩm" : "Products"}</p>
          <Link href="/skills">{vi ? "Kho Skill" : "Skill Library"}</Link>
          <Link href="/support">{vi ? "Cách sử dụng" : "How it works"}</Link>
        </div>
        <div className="footer-links">
          <p>{vi ? "Thông tin" : "Information"}</p>
          <Link href="/legal/terms">{vi ? "Điều khoản" : "Terms"}</Link>
          <Link href="/legal/privacy">{vi ? "Bảo mật" : "Privacy"}</Link>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© 2026 Skillroom</span>
        <span>{vi ? "Sản phẩm số • Giao qua email" : "Digital products • Delivered by email"}</span>
      </div>
    </footer>
  );
}
