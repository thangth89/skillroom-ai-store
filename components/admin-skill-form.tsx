"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createSkill,
  updateSkill,
  type SkillActionState,
} from "@/app/admin/skills/actions";
import type { SkillRecord } from "@/lib/supabase/skill-records";

const initialState: SkillActionState = { error: "" };

function lines(items: string[] | undefined) {
  return items?.join("\n") ?? "";
}

export function AdminSkillForm({ skill }: { skill?: SkillRecord }) {
  const action = skill ? updateSkill : createSkill;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="admin-skill-form">
      {skill ? <input name="id" type="hidden" value={skill.id} /> : null}

      {state.error ? (
        <div aria-live="polite" className="admin-form-error">
          {state.error}
        </div>
      ) : null}

      <section className="admin-form-section">
        <div className="admin-form-heading">
          <span>THÔNG TIN CHÍNH</span>
          <p>Tên, đường dẫn, giá và trạng thái hiển thị của Skill.</p>
        </div>
        <div className="admin-form-grid">
          <label className="wide-field">
            <span>Tên Skill *</span>
            <input defaultValue={skill?.name} maxLength={120} name="name" required />
          </label>
          <label>
            <span>Đường dẫn *</span>
            <input
              defaultValue={skill?.slug}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="nature-aquascape-v22"
              required
            />
            <small>Chữ thường không dấu, dùng dấu gạch ngang.</small>
          </label>
          <label>
            <span>Nhóm *</span>
            <input defaultValue={skill?.category} name="category" placeholder="Aquascape" required />
          </label>
          <label>
            <span>Phiên bản *</span>
            <input defaultValue={skill?.version ?? "V1.0"} name="version" required />
          </label>
          <label>
            <span>Giá bán (VND) *</span>
            <input defaultValue={skill?.price} min={0} name="price" step={1000} type="number" required />
          </label>
          <label>
            <span>Trạng thái *</span>
            <select defaultValue={skill?.status ?? "draft"} name="status">
              <option value="draft">Bản nháp</option>
              <option value="published">Đang bán</option>
              <option value="archived">Đã ẩn</option>
            </select>
          </label>
          <label className="checkbox-field">
            <input defaultChecked={skill?.featured} name="featured" type="checkbox" />
            <span>Đánh dấu là Skill nổi bật</span>
          </label>
        </div>
      </section>

      <section className="admin-form-section international-fields">
        <div className="admin-form-heading">
          <span>CỬA HÀNG QUỐC TẾ</span>
          <p>Nội dung tiếng Anh và giá USD. Để trống tên tiếng Anh nếu chưa muốn hiện Skill ở bản quốc tế.</p>
        </div>
        <div className="admin-form-grid">
          <label className="wide-field">
            <span>English Skill name</span>
            <input defaultValue={skill?.name_en ?? ""} maxLength={120} name="name_en" />
          </label>
          <label>
            <span>English category</span>
            <input defaultValue={skill?.category_en ?? ""} name="category_en" placeholder="Model Assembly" />
          </label>
          <label>
            <span>International price (USD)</span>
            <input defaultValue={skill?.price_usd_cents == null ? "" : skill.price_usd_cents / 100} min={0} name="price_usd" step="0.01" type="number" />
          </label>
          <label className="checkbox-field">
            <input defaultChecked={skill?.is_free ?? false} name="is_free" type="checkbox" />
            <span>Đây là Free Skill — chỉ cần email, không thanh toán</span>
          </label>
          <label className="wide-field">
            <span>English eyebrow</span>
            <input defaultValue={skill?.eyebrow_en ?? ""} name="eyebrow_en" />
          </label>
          <label className="wide-field">
            <span>English card description</span>
            <textarea defaultValue={skill?.short_description_en ?? ""} name="short_description_en" rows={3} />
          </label>
          <label className="wide-field">
            <span>English full description</span>
            <textarea defaultValue={skill?.description_en ?? ""} name="description_en" rows={6} />
          </label>
          <label>
            <span>English outcomes</span>
            <textarea defaultValue={lines(skill?.outcomes_en)} name="outcomes_en" rows={7} />
          </label>
          <label>
            <span>English deliverables</span>
            <textarea defaultValue={lines(skill?.deliverables_en)} name="deliverables_en" rows={7} />
          </label>
          <label>
            <span>English requirements</span>
            <textarea defaultValue={lines(skill?.requirements_en)} name="requirements_en" rows={7} />
          </label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-heading">
          <span>NỘI DUNG GIỚI THIỆU</span>
          <p>Nội dung khách hàng đọc trước khi quyết định mua.</p>
        </div>
        <div className="admin-form-grid">
          <label className="wide-field">
            <span>Dòng giới thiệu ngắn</span>
            <input defaultValue={skill?.eyebrow} name="eyebrow" />
          </label>
          <label className="wide-field">
            <span>Mô tả trên thẻ sản phẩm *</span>
            <textarea defaultValue={skill?.short_description} name="short_description" required rows={3} />
          </label>
          <label className="wide-field">
            <span>Mô tả chi tiết *</span>
            <textarea defaultValue={skill?.description} name="description" required rows={6} />
          </label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-heading">
          <span>VIDEO VÀ FILE GIAO</span>
          <p>Hỗ trợ MP4 trực tiếp, YouTube, Facebook và Instagram.</p>
        </div>
        <div className="admin-form-grid">
          <label className="wide-field">
            <span>URL video thành phẩm</span>
            <input defaultValue={skill?.video_url ?? ""} name="video_url" placeholder="https://youtu.be/... hoặc https://.../video.mp4" type="url" />
            <small>Nhận link MP4, YouTube, Facebook Video/Reel hoặc Instagram Post/Reel công khai.</small>
          </label>
          <label className="wide-field">
            <span>{skill?.file_path ? "Thay file Skill" : "File Skill"}</span>
            <input accept=".skill,.zip,.md,.txt,.json" name="skill_file" type="file" />
            <small>
              Tối đa 4 MB. {skill?.file_path ? `File hiện tại: ${skill.file_path}` : "Có thể để trống khi lưu nháp."}
            </small>
          </label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-heading">
          <span>GIÁ TRỊ BÀN GIAO</span>
          <p>Mỗi dòng là một ý riêng hiển thị trên trang chi tiết.</p>
        </div>
        <div className="admin-form-grid three-columns">
          <label>
            <span>Kết quả đạt được</span>
            <textarea defaultValue={lines(skill?.outcomes)} name="outcomes" rows={7} />
          </label>
          <label>
            <span>Khách nhận được</span>
            <textarea defaultValue={lines(skill?.deliverables)} name="deliverables" rows={7} />
          </label>
          <label>
            <span>Yêu cầu sử dụng</span>
            <textarea defaultValue={lines(skill?.requirements)} name="requirements" rows={7} />
          </label>
        </div>
      </section>

      <section className="admin-form-section compact-section">
        <div className="admin-form-heading">
          <span>MÀU VIDEO</span>
          <p>Màu nền dự phòng khi video chưa tải xong.</p>
        </div>
        <div className="admin-form-grid color-fields">
          <label>
            <span>Màu nhấn</span>
            <input defaultValue={skill?.accent ?? "#b8ff6a"} name="accent" pattern="#[0-9a-fA-F]{6}" />
          </label>
          <label>
            <span>Màu nền</span>
            <input defaultValue={skill?.accent_soft ?? "#19351e"} name="accent_soft" pattern="#[0-9a-fA-F]{6}" />
          </label>
        </div>
      </section>

      <div className="admin-form-actions">
        <Link className="secondary-button" href="/admin/skills">
          Quay lại
        </Link>
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Đang lưu…" : skill ? "Lưu thay đổi" : "Tạo Skill"}
        </button>
      </div>
    </form>
  );
}
