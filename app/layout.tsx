import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import "./polish.css";

export const metadata: Metadata = {
  title: {
    default: "Skillroom — Skill AI có video kiểm chứng",
    template: "%s — Skillroom",
  },
  description: "Xem video thành phẩm, đọc chi tiết và mua Skill AI an toàn qua VietQR.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
