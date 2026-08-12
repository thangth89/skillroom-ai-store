import { AdminShell } from "@/components/admin-shell";
import { AdminSkillForm } from "@/components/admin-skill-form";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function NewSkillPage() {
  await requireAdmin();

  return (
    <AdminShell eyebrow="CATALOG" title="Add Skill">
      <AdminSkillForm />
    </AdminShell>
  );
}
