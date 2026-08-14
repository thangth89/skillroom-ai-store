import { DOWNLOAD_LIMIT, getDownloadAccess } from "@/lib/downloads";
import { createAdminClient, getSkillStorageBucket } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safeDownloadName(skillName: string, version: string, filePath: string) {
  const extension = filePath.split(".").pop()?.toLowerCase();
  const safeExtension = extension && /^[a-z0-9]{1,8}$/.test(extension) ? extension : "skill";
  const base = `${skillName}-${version}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base || "skillroom-skill"}.${safeExtension}`;
}

function errorResponse(message: string, status: number) {
  return Response.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const access = await getDownloadAccess(token);

  if (access.status === "invalid") return errorResponse("The download link is invalid.", 404);
  if (access.status === "expired") return errorResponse("The download link has expired.", 410);
  if (access.status === "exhausted") {
    return errorResponse(`The link has reached its ${DOWNLOAD_LIMIT}-download limit.`, 429);
  }
  if (access.status !== "ready") return errorResponse("The Skill file is not available.", 403);

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("download_tokens")
    .update({
      download_count: access.token.download_count + 1,
      used_at: now,
    })
    .eq("id", access.token.id)
    .eq("download_count", access.token.download_count)
    .gt("expires_at", now)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError || !updated) {
    return errorResponse("This download link was revoked, expired, or just used in another request.", 410);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", access.item.order_id)
    .maybeSingle<{ status: string }>();
  if (orderError || order?.status !== "paid") {
    return errorResponse("This download link is no longer available for this order.", 410);
  }

  const fileName = safeDownloadName(
    access.item.skill_name,
    access.item.version,
    access.item.file_path,
  );
  const { data, error } = await supabase.storage
    .from(getSkillStorageBucket())
    .createSignedUrl(access.item.file_path, 15, { download: fileName });

  if (error || !data?.signedUrl) return errorResponse("We could not create the file download.", 500);

  return Response.redirect(data.signedUrl, 302);
}
