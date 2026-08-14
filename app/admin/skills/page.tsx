import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { AdminSkillSorter } from "@/components/admin-skill-sorter";
import { hasAdminDataConfig, requireAdmin } from "@/lib/supabase/admin";
import { listAdminSkills } from "@/lib/supabase/skill-records";

export const dynamic = "force-dynamic";

export default async function AdminSkillsPage() {
  await requireAdmin();

  if (!hasAdminDataConfig()) {
    return (
      <AdminShell eyebrow="CATALOG" title="Manage Skills">
        <section className="admin-panel empty-panel">
          <div className="empty-mark">!</div>
          <h2>Server configuration is incomplete.</h2>
          <p>Check SUPABASE_SECRET_KEY and SKILL_STORAGE_BUCKET on Vercel, then redeploy.</p>
        </section>
      </AdminShell>
    );
  }

  const { data: skills, error, sortReady } = await listAdminSkills();

  return (
    <AdminShell eyebrow="CATALOG" title="Manage Skills">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>{skills?.length ?? 0} SHARED SKILL RECORDS</span>
            <h2>Vietnam &amp; international Skill catalog</h2>
          </div>
          <Link className="primary-button" href="/admin/skills/new">
            + Add Skill
          </Link>
        </div>

        {error ? <div className="admin-form-error">Unable to load data: {error.message}</div> : null}

        {!error && skills?.length === 0 ? (
          <div className="admin-list-empty">
            <strong>No Skill records are available in Supabase.</strong>
            <p>Create the first Skill here, then configure each market independently.</p>
          </div>
        ) : null}

        {skills && skills.length > 0 ? (
          <AdminSkillSorter skills={skills} sortReady={sortReady} />
        ) : null}
      </section>
    </AdminShell>
  );
}
