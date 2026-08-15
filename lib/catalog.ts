import "server-only";

import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";
import {
  getSkill as getDemoSkill,
  getSkillsPage as getDemoSkillsPage,
  pageSize,
} from "@/lib/skills";
import type { StoreLocale } from "@/lib/locale";
import type { SkillProduct } from "@/lib/types";

type PublicSkillRow = {
  slug: string;
  name: string;
  eyebrow: string;
  short_description: string;
  description: string;
  price: number;
  discount_percent_vn?: number;
  category: string;
  deliverables: string[];
  outcomes: string[];
  requirements: string[];
  name_en: string | null;
  eyebrow_en: string | null;
  short_description_en: string | null;
  description_en: string | null;
  price_usd_cents: number | null;
  discount_percent_international?: number;
  is_free: boolean | null;
  lemon_checkout_url: string | null;
  category_en: string | null;
  deliverables_en: string[] | null;
  outcomes_en: string[] | null;
  requirements_en: string[] | null;
  version: string;
  video_url: string;
  accent: string | null;
  accent_soft: string | null;
  featured: boolean;
};

function isMissingInternationalFieldsError(error: { code?: string; message: string } | null) {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("name_en") ||
    message.includes("price_usd_cents") ||
    message.includes("is_free") ||
    message.includes("lemon_checkout_url")
  );
}

function isMissingSortOrderError(error: { code?: string; message: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message.toLowerCase().includes("sort_order")
  );
}

function isMissingDiscountFieldsError(error: { code?: string; message: string } | null) {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    (error.code === "42703" || error.code === "PGRST204") &&
    (message.includes("discount_percent_vn") || message.includes("discount_percent_international"))
  );
}

const basePublicSkillColumns = [
  "slug",
  "name",
  "eyebrow",
  "short_description",
  "description",
  "price",
  "category",
  "deliverables",
  "outcomes",
  "requirements",
  "name_en",
  "eyebrow_en",
  "short_description_en",
  "description_en",
  "price_usd_cents",
  "is_free",
  "lemon_checkout_url",
  "category_en",
  "deliverables_en",
  "outcomes_en",
  "requirements_en",
  "version",
  "video_url",
  "accent",
  "accent_soft",
  "featured",
];

const discountColumns = ["discount_percent_vn", "discount_percent_international"];

function mapSkill(row: PublicSkillRow, locale: StoreLocale): SkillProduct {
  const english = locale === "en";
  return {
    slug: row.slug,
    name: english ? row.name_en || row.name : row.name,
    eyebrow: english ? row.eyebrow_en || row.eyebrow : row.eyebrow,
    shortDescription: english
      ? row.short_description_en || row.short_description
      : row.short_description,
    description: english ? row.description_en || row.description : row.description,
    priceVnd: row.price,
    priceUsdCents: row.price_usd_cents,
    discountPercent: english
      ? row.discount_percent_international ?? 0
      : row.discount_percent_vn ?? 0,
    // Vietnam and international sales types are intentionally independent.
    // A zero VND price means free in Vietnam; is_free belongs to the
    // international storefront only.
    isFree: english ? row.is_free === true : row.price === 0,
    internationalCheckoutUrl: row.lemon_checkout_url,
    category: english ? row.category_en || row.category : row.category,
    version: row.version,
    videoSrc: row.video_url,
    accent: row.accent || "#b8ff6a",
    accentSoft: row.accent_soft || "#19351e",
    featured: row.featured,
    deliverables: english ? row.deliverables_en ?? row.deliverables ?? [] : row.deliverables ?? [],
    outcomes: english ? row.outcomes_en ?? row.outcomes ?? [] : row.outcomes ?? [],
    requirements: english ? row.requirements_en ?? row.requirements ?? [] : row.requirements ?? [],
  };
}

function publishedSkillsQuery(locale: StoreLocale, includeDiscounts = true) {
  // Supabase's fluent generic grows beyond TypeScript's instantiation limit when
  // optional locale filters are composed dynamically. The returned rows are still
  // checked with PublicSkillRow at the terminal query.
  const query: any = createAdminClient()
    .from("skills")
    .select([
      ...basePublicSkillColumns,
      ...(includeDiscounts ? discountColumns : []),
    ].join(","))
    .eq("status", "published")
    .not("video_url", "is", null)
    .not("file_path", "is", null);

  return locale === "en" ? query.not("name_en", "is", null).neq("name_en", "") : query;
}

async function getPublishedSkillsRange(locale: StoreLocale, start: number, end: number) {
  let includeDiscounts = true;
  let useCustomOrder = true;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const query = publishedSkillsQuery(locale, includeDiscounts);
    const orderedQuery = useCustomOrder
      ? query.order("sort_order", { ascending: true }).order("created_at", { ascending: true })
      : query.order("featured", { ascending: false }).order("updated_at", { ascending: false });
    const result = await orderedQuery.range(start, end) as {
      data: PublicSkillRow[] | null;
      error: { code?: string; message: string } | null;
    };

    if (includeDiscounts && isMissingDiscountFieldsError(result.error)) {
      includeDiscounts = false;
      continue;
    }
    if (useCustomOrder && isMissingSortOrderError(result.error)) {
      useCustomOrder = false;
      continue;
    }
    return result;
  }

  return {
    data: null,
    error: { message: "The Skill catalog could not be loaded." },
  };
}

async function getPublishedSkill(locale: StoreLocale, slug: string) {
  const result = await publishedSkillsQuery(locale)
    .eq("slug", slug)
    .maybeSingle() as {
      data: PublicSkillRow | null;
      error: { code?: string; message: string } | null;
    };

  if (!isMissingDiscountFieldsError(result.error)) return result;

  return publishedSkillsQuery(locale, false)
    .eq("slug", slug)
    .maybeSingle() as Promise<{
      data: PublicSkillRow | null;
      error: { code?: string; message: string } | null;
    }>;
}

async function countPublishedSkills(locale: StoreLocale) {
  if (!hasAdminDataConfig()) return { total: 0, internationalReady: false };

  const query: any = createAdminClient()
    .from("skills")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .not("video_url", "is", null)
    .not("file_path", "is", null);

  const filteredQuery = locale === "en"
    ? query.not("name_en", "is", null).neq("name_en", "")
    : query;
  const { count, error } = await filteredQuery;

  if (locale === "en" && isMissingInternationalFieldsError(error)) {
    return { total: 0, internationalReady: false };
  }
  return { total: error ? 0 : count ?? 0, internationalReady: !error };
}

function demoPage(page: number, locale: StoreLocale) {
  const result = getDemoSkillsPage(page);
  if (locale === "en") return result;
  return { ...result, items: result.items.map((skill) => ({ ...skill, isFree: false })) };
}

export async function getCatalogPage(page: number, locale: StoreLocale) {
  if (!hasAdminDataConfig()) return demoPage(page, locale);

  const count = await countPublishedSkills(locale);
  if (!count.internationalReady || count.total === 0) {
    return { items: [], page: 1, pages: 1, total: 0 };
  }
  const total = count.total;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(Math.trunc(page) || 1, 1), pages);
  const start = (safePage - 1) * pageSize;
  const { data, error } = await getPublishedSkillsRange(
    locale,
    start,
    start + pageSize - 1,
  );

  if (error || !data || (locale === "en" && isMissingInternationalFieldsError(error))) {
    return { items: [], page: safePage, pages, total: 0 };
  }

  return { items: data.map((row) => mapSkill(row, locale)), page: safePage, pages, total };
}

export async function getCatalogSkill(slug: string, locale: StoreLocale) {
  if (!hasAdminDataConfig()) return getDemoSkill(slug);

  const { data, error } = await getPublishedSkill(locale, slug);

  if (!error && data) return mapSkill(data, locale);
  if (locale === "en" && isMissingInternationalFieldsError(error)) return undefined;
  return undefined;
}

export async function getCatalogSkillOrFirst(slug: string, locale: StoreLocale) {
  const skill = await getCatalogSkill(slug, locale);
  if (skill) return skill;

  const catalog = await getCatalogPage(1, locale);
  return catalog.items[0];
}
