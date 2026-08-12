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
          <span>SHARED SOURCE DATA</span>
          <p>Core record shared with the Vietnamese store. These fields remain required by the shared database.</p>
        </div>
        <div className="admin-form-grid">
          <label className="wide-field">
            <span>Source Skill name *</span>
            <input defaultValue={skill?.name} maxLength={120} name="name" required />
          </label>
          <label>
            <span>Slug *</span>
            <input
              defaultValue={skill?.slug}
              name="slug"
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="nature-aquascape-v22"
              required
            />
            <small>Use lowercase letters, numbers and hyphens only.</small>
          </label>
          <label>
            <span>Source category *</span>
            <input defaultValue={skill?.category} name="category" placeholder="Aquascape" required />
          </label>
          <label>
            <span>Version *</span>
            <input defaultValue={skill?.version ?? "V1.0"} name="version" required />
          </label>
          <label>
            <span>Vietnam price (VND) *</span>
            <input defaultValue={skill?.price} min={0} name="price" step={1000} type="number" required />
          </label>
          <label>
            <span>Status *</span>
            <select defaultValue={skill?.status ?? "draft"} name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="checkbox-field">
            <input defaultChecked={skill?.featured} name="featured" type="checkbox" />
            <span>Feature this Skill</span>
          </label>
        </div>
      </section>

      <section className="admin-form-section international-fields">
        <div className="admin-form-heading">
          <span>INTERNATIONAL STOREFRONT</span>
          <p>English content and USD pricing. Leave the English name blank to keep this Skill off the international store.</p>
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
            <span>Free Skill — email delivery, no payment required</span>
          </label>
          <label className="wide-field">
            <span>Lemon Squeezy Checkout URL</span>
            <input
              defaultValue={skill?.lemon_checkout_url ?? ""}
              name="lemon_checkout_url"
              placeholder="https://your-store.lemonsqueezy.com/checkout/buy/..."
              type="url"
            />
            <small>Use one unique Checkout URL for each paid Skill. Leave blank for a Free Skill.</small>
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
          <span>VIETNAMESE SOURCE COPY</span>
          <p>Shared source content used by the Vietnamese storefront.</p>
        </div>
        <div className="admin-form-grid">
          <label className="wide-field">
            <span>Source eyebrow</span>
            <input defaultValue={skill?.eyebrow} name="eyebrow" />
          </label>
          <label className="wide-field">
            <span>Source card description *</span>
            <textarea defaultValue={skill?.short_description} name="short_description" required rows={3} />
          </label>
          <label className="wide-field">
            <span>Source full description *</span>
            <textarea defaultValue={skill?.description} name="description" required rows={6} />
          </label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-heading">
          <span>VIDEO &amp; DELIVERY FILE</span>
          <p>Supports direct MP4, YouTube, Facebook and Instagram URLs.</p>
        </div>
        <div className="admin-form-grid">
          <label className="wide-field">
            <span>Result video URL</span>
            <input defaultValue={skill?.video_url ?? ""} name="video_url" placeholder="https://youtu.be/... or https://.../video.mp4" type="url" />
            <small>Public MP4, YouTube, Facebook Video/Reel or Instagram Post/Reel URL.</small>
          </label>
          <label className="wide-field">
            <span>{skill?.file_path ? "Replace Skill file" : "Skill file"}</span>
            <input accept=".skill,.zip,.md,.txt,.json" name="skill_file" type="file" />
            <small>
              Maximum 4 MB. {skill?.file_path ? `Current file: ${skill.file_path}` : "May be left blank while saving a draft."}
            </small>
          </label>
        </div>
      </section>

      <section className="admin-form-section">
        <div className="admin-form-heading">
          <span>VIETNAMESE SOURCE DETAILS</span>
          <p>One item per line. International equivalents are managed above.</p>
        </div>
        <div className="admin-form-grid three-columns">
          <label>
            <span>Source outcomes</span>
            <textarea defaultValue={lines(skill?.outcomes)} name="outcomes" rows={7} />
          </label>
          <label>
            <span>Source deliverables</span>
            <textarea defaultValue={lines(skill?.deliverables)} name="deliverables" rows={7} />
          </label>
          <label>
            <span>Source requirements</span>
            <textarea defaultValue={lines(skill?.requirements)} name="requirements" rows={7} />
          </label>
        </div>
      </section>

      <section className="admin-form-section compact-section">
        <div className="admin-form-heading">
          <span>VIDEO COLORS</span>
          <p>Fallback colors shown while the video preview is loading.</p>
        </div>
        <div className="admin-form-grid color-fields">
          <label>
            <span>Accent color</span>
            <input defaultValue={skill?.accent ?? "#b8ff6a"} name="accent" pattern="#[0-9a-fA-F]{6}" />
          </label>
          <label>
            <span>Background color</span>
            <input defaultValue={skill?.accent_soft ?? "#19351e"} name="accent_soft" pattern="#[0-9a-fA-F]{6}" />
          </label>
        </div>
      </section>

      <div className="admin-form-actions">
        <Link className="secondary-button" href="/admin/skills">
          Back
        </Link>
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? "Saving…" : skill ? "Save changes" : "Create Skill"}
        </button>
      </div>
    </form>
  );
}
