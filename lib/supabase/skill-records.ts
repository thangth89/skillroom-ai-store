import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type SkillStatus = "draft" | "published" | "archived";

export type SkillRecord = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  short_description: string;
  description: string;
  price: number;
  category: string;
  version: string;
  status: SkillStatus;
  video_url: string | null;
  file_path: string | null;
  accent: string | null;
  accent_soft: string | null;
  featured: boolean;
  sort_order: number;
  deliverables: string[];
  outcomes: string[];
  requirements: string[];
  name_en?: string | null;
  eyebrow_en?: string | null;
  short_description_en?: string | null;
  description_en?: string | null;
  category_en?: string | null;
  price_usd_cents?: number | null;
  is_free?: boolean;
  lemon_checkout_url?: string | null;
  deliverables_en?: string[];
  outcomes_en?: string[];
  requirements_en?: string[];
  created_at: string;
  updated_at: string;
};

function isMissingSortOrderError(error: { code?: string; message: string } | null) {
  if (!error) return false;
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message.toLowerCase().includes("sort_order")
  );
}

export async function listAdminSkills() {
  const supabase = createAdminClient();
  const orderedResult = await supabase
    .from("skills")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<SkillRecord[]>();

  if (!isMissingSortOrderError(orderedResult.error)) {
    return { ...orderedResult, sortReady: true };
  }

  const fallbackResult = await supabase
    .from("skills")
    .select("*")
    .order("featured", { ascending: false })
    .order("updated_at", { ascending: false })
    .returns<SkillRecord[]>();

  return { ...fallbackResult, sortReady: false };
}

export async function getAdminSkill(id: string) {
  const supabase = createAdminClient();
  return supabase
    .from("skills")
    .select("*")
    .eq("id", id)
    .maybeSingle<SkillRecord>();
}

export async function getAdminSkillStats() {
  const supabase = createAdminClient();
  const [allResult, publishedResult] = await Promise.all([
    supabase.from("skills").select("id", { count: "exact", head: true }),
    supabase
      .from("skills")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
  ]);

  return {
    total: allResult.count ?? 0,
    published: publishedResult.count ?? 0,
    error: allResult.error ?? publishedResult.error,
  };
}
