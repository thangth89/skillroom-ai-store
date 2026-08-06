export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasAdminAuthConfig() {
  return hasSupabaseConfig() && getAdminEmails().length > 0;
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
