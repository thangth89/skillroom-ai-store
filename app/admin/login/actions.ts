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
      error: "Chưa cấu hình Supabase và ADMIN_EMAILS trên Vercel.",
    };
  }

  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";

  if (!email || !password) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Email hoặc mật khẩu không chính xác." };
  }

  if (!isAdminEmail(data.user.email)) {
    await supabase.auth.signOut();
    return { error: "Tài khoản này không có quyền quản trị." };
  }

  redirect(getSafeNext(formData.get("next")));
}
