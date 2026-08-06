import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { hasAdminAuthConfig, isAdminEmail } from "@/lib/supabase/config";
import { createClient as createSessionClient } from "@/lib/supabase/server";

export function hasAdminDataConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SECRET_KEY &&
      process.env.SKILL_STORAGE_BUCKET,
  );
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Thiếu cấu hình Supabase phía máy chủ.");
  }

  return createSupabaseClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSkillStorageBucket() {
  return process.env.SKILL_STORAGE_BUCKET ?? "";
}

export async function requireAdmin() {
  if (!hasAdminAuthConfig()) {
    redirect("/admin/login?setup=required");
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !isAdminEmail(data.user.email)) {
    redirect("/admin/login");
  }

  return data.user;
}
