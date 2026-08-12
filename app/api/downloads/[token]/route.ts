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
  const fileName = safeDownloadName(
    access.item.skill_name,
    access.item.version,
    access.item.file_path,
  );
  const { data, error } = await supabase.storage
    .from(getSkillStorageBucket())
    .createSignedUrl(access.item.file_path, 60, { download: fileName });

  if (error || !data?.signedUrl) return errorResponse("We could not create the file download.", 500);

  const { data: updated, error: updateError } = await supabase
    .from("download_tokens")
    .update({
      download_count: access.token.download_count + 1,
      used_at: new Date().toISOString(),
    })
    .eq("id", access.token.id)
    .eq("download_count", access.token.download_count)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (updateError || !updated) {
    return errorResponse("Another download was just recorded. Please try again.", 409);
  }

  return Response.redirect(data.signedUrl, 302);
}
