import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
import "./polish.css";

export const metadata: Metadata = {
  title: {
    default: "Skillroom — Video-verified AI Skills",
    template: "%s — Skillroom",
  },
  description: "Watch real outputs, understand the workflow and get practical AI Skills delivered securely by email.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
