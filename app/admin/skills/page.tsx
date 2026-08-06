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
      <AdminShell eyebrow="NỘI DUNG" title="Quản lý Skill">
        <section className="admin-panel empty-panel">
          <div className="empty-mark">!</div>
          <h2>Thiếu cấu hình máy chủ.</h2>
          <p>Kiểm tra SUPABASE_SECRET_KEY và SKILL_STORAGE_BUCKET trên Vercel rồi redeploy.</p>
        </section>
      </AdminShell>
    );
  }

  const { data: skills, error, sortReady } = await listAdminSkills();

  return (
    <AdminShell eyebrow="NỘI DUNG" title="Quản lý Skill">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>{skills?.length ?? 0} SẢN PHẨM THẬT</span>
            <h2>Danh sách Skill</h2>
          </div>
          <Link className="primary-button" href="/admin/skills/new">
            + Thêm Skill
          </Link>
        </div>

        {error ? <div className="admin-form-error">Không thể đọc dữ liệu: {error.message}</div> : null}

        {!error && skills?.length === 0 ? (
          <div className="admin-list-empty">
            <strong>Chưa có Skill thật trong Supabase.</strong>
            <p>12 sản phẩm mẫu ngoài cửa hàng vẫn được giữ nguyên. Hãy tạo Skill đầu tiên tại đây.</p>
          </div>
        ) : null}

        {skills && skills.length > 0 ? (
          <AdminSkillSorter skills={skills} sortReady={sortReady} />
        ) : null}
      </section>
    </AdminShell>
  );
}
