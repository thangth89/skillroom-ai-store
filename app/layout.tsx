import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import "./polish.css";
import { getStoreLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getStoreLocale();
  const vi = locale === "vi";
  return {
    title: {
      default: vi ? "Skillroom — Skill AI có video kiểm chứng" : "Skillroom — Video-verified AI Skills",
      template: "%s — Skillroom",
    },
    description: vi
      ? "Xem video thành phẩm, đọc chi tiết và mua Skill AI an toàn qua VietQR."
      : "Watch real outputs, understand the workflow and get practical AI Skills delivered securely by email.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getStoreLocale();
  return <html lang={locale}><body>{children}</body></html>;
}
