import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { formatVnd } from "@/lib/format";
import { hasAdminDataConfig, requireAdmin } from "@/lib/supabase/admin";
import { listAdminSkills, type SkillStatus } from "@/lib/supabase/skill-records";

export const dynamic = "force-dynamic";

const statusLabel: Record<SkillStatus, string> = {
  draft: "Bản nháp",
  published: "Đang bán",
  archived: "Đã ẩn",
};

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

  const { data: skills, error } = await listAdminSkills();

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
          <div className="admin-table">
            <div className="table-row table-head">
              <span>Sản phẩm</span>
              <span>Nhóm</span>
              <span>Giá</span>
              <span>Trạng thái</span>
            </div>
            {skills.map((skill) => (
              <div className="table-row" key={skill.id}>
                <span>
                  <strong>{skill.name}</strong>
                  <small>{skill.version} · /{skill.slug}</small>
                </span>
                <span>{skill.category}</span>
                <span>{formatVnd(skill.price)}</span>
                <span>
                  <i className={`skill-status ${skill.status}`}>{statusLabel[skill.status]}</i>
                  <Link href={`/admin/skills/${skill.id}`}>Sửa ↗</Link>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </AdminShell>
  );
}
