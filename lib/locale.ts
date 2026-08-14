import "server-only";

import { cookies, headers } from "next/headers";

export type StoreLocale = "vi" | "en";

export const LOCALE_COOKIE = "skillroom_locale";

export async function getStoreLocale(): Promise<StoreLocale> {
  const cookieStore = await cookies();
  const selected = cookieStore.get(LOCALE_COOKIE)?.value;
  if (selected === "vi" || selected === "en") return selected;

  const requestHeaders = await headers();
  const country = requestHeaders.get("x-vercel-ip-country")?.toUpperCase();
  if (country) return country === "VN" ? "vi" : "en";

  const acceptedLanguage = requestHeaders.get("accept-language")?.toLowerCase() ?? "";
  return acceptedLanguage.includes("vi") ? "vi" : "en";
}

export function isVietnamese(locale: StoreLocale) {
  return locale === "vi";
}
