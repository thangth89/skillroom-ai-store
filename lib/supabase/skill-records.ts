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
  deliverables: string[];
  outcomes: string[];
  requirements: string[];
  created_at: string;
  updated_at: string;
};

export async function listAdminSkills() {
  const supabase = createAdminClient();
  return supabase
    .from("skills")
    .select("*")
    .order("updated_at", { ascending: false })
    .returns<SkillRecord[]>();
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
