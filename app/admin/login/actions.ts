"use server";

import { redirect } from "next/navigation";
import {
  hasAdminAuthConfig,
  isAdminEmail,
} from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type LoginState = {
  error: string;
};

function getSafeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "/admin";
  if (!value.startsWith("/admin") || value.startsWith("//")) return "/admin";
  return value;
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!hasAdminAuthConfig()) {
    return {
      error: "Supabase and ADMIN_EMAILS are not configured on Vercel.",
    };
  }

  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    return { error: "Enter both your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "The email or password is incorrect." };
  }

  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { error: "This account does not have administrator access." };
  }

  redirect(getSafeNext(formData.get("next")));
}
