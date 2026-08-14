"use client";

import { useRouter } from "next/navigation";
import type { StoreLocale } from "@/lib/locale";

export function LocaleSwitcher({ locale }: { locale: StoreLocale }) {
  const router = useRouter();
  const nextLocale: StoreLocale = locale === "vi" ? "en" : "vi";

  function switchLocale() {
    document.cookie = `skillroom_locale=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <button
      aria-label={locale === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
      className="locale-switcher"
      onClick={switchLocale}
      type="button"
    >
      <span className={locale === "vi" ? "active" : ""}>VN</span>
      <i aria-hidden="true">/</i>
      <span className={locale === "en" ? "active" : ""}>EN</span>
    </button>
  );
}
