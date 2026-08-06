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
  name: string;
  eyebrow: string;
  short_description: string;
  description: string;
  price: number;
  category: string;
  version: string;
  video_url: string;
  accent: string | null;
  accent_soft: string | null;
  featured: boolean;
  deliverables: string[];
  outcomes: string[];
  requirements: string[];
};

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
  "name",
  "eyebrow",
  "short_description",
  "description",
  "price",
  "category",
  "version",
  "video_url",
  "accent",
  "accent_soft",
  "featured",
  "deliverables",
  "outcomes",
  "requirements",
].join(",");

function mapSkill(row: PublicSkillRow): SkillProduct {
  return {
    slug: row.slug,
    name: row.name,
    eyebrow: row.eyebrow,
    shortDescription: row.short_description,
    description: row.description,
    price: row.price,
    category: row.category,
    version: row.version,
    videoSrc: row.video_url,
    accent: row.accent || "#b8ff6a",
    accentSoft: row.accent_soft || "#19351e",
    featured: row.featured,
    deliverables: row.deliverables ?? [],
    outcomes: row.outcomes ?? [],
    requirements: row.requirements ?? [],
  };
}

function publishedSkillsQuery() {
  return createAdminClient()
    .from("skills")
    .select(publicSkillColumns)
    .eq("status", "published")
    .not("video_url", "is", null)
    .not("file_path", "is", null);
}

async function countPublishedSkills() {
  if (!hasAdminDataConfig()) return 0;

  const { count, error } = await createAdminClient()
    .from("skills")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .not("video_url", "is", null)
    .not("file_path", "is", null);

  return error ? 0 : count ?? 0;
}

export async function getCatalogPage(page: number) {
  if (!hasAdminDataConfig()) return getDemoSkillsPage(page);

  const total = await countPublishedSkills();
  if (total === 0) return getDemoSkillsPage(page);

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

  if (error || !data) return getDemoSkillsPage(page);

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

  const total = await countPublishedSkills();
  return total === 0 ? getDemoSkill(slug) : undefined;
}

export async function getCatalogSkillOrFirst(slug: string) {
  const skill = await getCatalogSkill(slug);
  if (skill) return skill;

  const catalog = await getCatalogPage(1);
  return catalog.items[0];
}
