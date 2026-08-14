import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminSkillForm } from "@/components/admin-skill-form";
import { requireAdmin } from "@/lib/supabase/admin";
import { getAdminSkill } from "@/lib/supabase/skill-records";

export const dynamic = "force-dynamic";

type EditSkillPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
};

export default async function EditSkillPage({ params, searchParams }: EditSkillPageProps) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { data: skill, error } = await getAdminSkill(id);

  if (error || !skill) notFound();

  return (
    <AdminShell eyebrow="CATALOG" title="Edit Skill">
      {query.created === "1" ? <div className="admin-success-notice">The Skill was created.</div> : null}
      {query.saved === "1" ? <div className="admin-success-notice">Changes saved.</div> : null}
      <AdminSkillForm skill={skill} />
    </AdminShell>
  );
}
