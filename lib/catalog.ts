import "server-only";

import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";
import {
  getSkill as getDemoSkill,
  getSkillsPage as getDemoSkillsPage,
  pageSize,
} from "@/lib/skills";
import type { SkillProduct } from "@/lib/types";

type PublicSkillRow = {
  slug: string;
  name_en: string;
  eyebrow_en: string;
  short_description_en: string;
  description_en: string;
  price_usd_cents: number | null;
  is_free: boolean;
  lemon_checkout_url: string | null;
  category_en: string;
  version: string;
  video_url: string;
  accent: string | null;
  accent_soft: string | null;
  featured: boolean;
  deliverables_en: string[];
  outcomes_en: string[];
  requirements_en: string[];
};

function isMissingInternationalFieldsError(error: { code?: string; message: string } | null) {
  if (!error) return false;
  const message = error.message.toLowerCase();
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    message.includes("name_en") ||
    message.includes("price_usd_cents") ||
    message.includes("is_free")
    || message.includes("lemon_checkout_url")
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

const publicSkillColumns = [
  "slug",
  "name_en",
  "eyebrow_en",
  "short_description_en",
  "description_en",
  "price_usd_cents",
  "is_free",
  "lemon_checkout_url",
  "category_en",
  "version",
  "video_url",
  "accent",
  "accent_soft",
  "featured",
  "deliverables_en",
  "outcomes_en",
  "requirements_en",
].join(",");

function mapSkill(row: PublicSkillRow): SkillProduct {
  return {
    slug: row.slug,
    name: row.name_en,
    eyebrow: row.eyebrow_en,
    shortDescription: row.short_description_en,
    description: row.description_en,
    priceUsdCents: row.price_usd_cents,
    isFree: row.is_free,
    lemonCheckoutUrl: row.lemon_checkout_url,
    category: row.category_en,
    version: row.version,
    videoSrc: row.video_url,
    accent: row.accent || "#b8ff6a",
    accentSoft: row.accent_soft || "#19351e",
    featured: row.featured,
    deliverables: row.deliverables_en ?? [],
    outcomes: row.outcomes_en ?? [],
    requirements: row.requirements_en ?? [],
  };
}

function publishedSkillsQuery() {
  return createAdminClient()
    .from("skills")
    .select(publicSkillColumns)
    .eq("status", "published")
    .not("name_en", "is", null)
    .neq("name_en", "")
    .not("video_url", "is", null)
    .not("file_path", "is", null);
}

async function countPublishedSkills() {
  if (!hasAdminDataConfig()) return { total: 0, internationalReady: false };

  const { count, error } = await createAdminClient()
    .from("skills")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .not("name_en", "is", null)
    .neq("name_en", "")
    .not("video_url", "is", null)
    .not("file_path", "is", null);

  if (isMissingInternationalFieldsError(error)) {
    return { total: 0, internationalReady: false };
  }
  return { total: error ? 0 : count ?? 0, internationalReady: !error };
}

export async function getCatalogPage(page: number) {
  if (!hasAdminDataConfig()) return getDemoSkillsPage(page);

  const count = await countPublishedSkills();
  if (!count.internationalReady || count.total === 0) return getDemoSkillsPage(page);
  const total = count.total;

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(Math.trunc(page) || 1, 1), pages);
  const start = (safePage - 1) * pageSize;
  const orderedResult = await publishedSkillsQuery()
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .range(start, start + pageSize - 1)
    .returns<PublicSkillRow[]>();

  const { data, error } = isMissingSortOrderError(orderedResult.error)
    ? await publishedSkillsQuery()
        .order("featured", { ascending: false })
        .order("updated_at", { ascending: false })
        .range(start, start + pageSize - 1)
        .returns<PublicSkillRow[]>()
    : orderedResult;

  if (error || !data || isMissingInternationalFieldsError(error)) return getDemoSkillsPage(page);

  return {
    items: data.map(mapSkill),
    page: safePage,
    pages,
    total,
  };
}

export async function getCatalogSkill(slug: string) {
  if (!hasAdminDataConfig()) return getDemoSkill(slug);

  const { data, error } = await publishedSkillsQuery()
    .eq("slug", slug)
    .maybeSingle<PublicSkillRow>();

  if (!error && data) return mapSkill(data);
  if (isMissingInternationalFieldsError(error)) return getDemoSkill(slug);

  const count = await countPublishedSkills();
  return count.total === 0 ? getDemoSkill(slug) : undefined;
}

export async function getCatalogSkillOrFirst(slug: string) {
  const skill = await getCatalogSkill(slug);
  if (skill) return skill;

  const catalog = await getCatalogPage(1);
  return catalog.items[0];
}
