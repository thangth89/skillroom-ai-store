import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getStoreLocale } from "@/lib/locale";

export async function SiteHeader() {
  const locale = await getStoreLocale();
  const vi = locale === "vi";

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label={vi ? "Skillroom - Trang chủ" : "Skillroom home"}>
          <span className="brand-mark">S</span>
          <span>Skillroom</span>
        </Link>
        <nav className="main-nav" aria-label={vi ? "Điều hướng chính" : "Main navigation"}>
          <Link href="/skills">{vi ? "Kho Skill" : "Skill Library"}</Link>
          <Link href="/support">{vi ? "Hướng dẫn" : "How it works"}</Link>
        </nav>
        <div className="header-actions">
          <LocaleSwitcher locale={locale} />
          <Link className="header-cta" href="/skills">
            {vi ? "Khám phá Skill" : "Explore Skills"} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
