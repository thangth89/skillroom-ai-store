"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
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
  const [vietnamSaleType, setVietnamSaleType] = useState<"free" | "paid">(
    skill?.price === 0 ? "free" : "paid",
  );
  const [internationalSaleType, setInternationalSaleType] = useState<"free" | "paid">(
    skill?.is_free ? "free" : "paid",
  );

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
          <span>SHARED SETTINGS</span>
          <p>Technical settings shared by both the Vietnamese and international storefronts.</p>
        </div>
        <div className="admin-form-grid">
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
            <span>Version *</span>
            <input defaultValue={skill?.version ?? "V1.0"} name="version" required />
          </label>
          <label>
            <span>Status *</span>
            <select defaultValue={skill?.status ?? "draft"} name="status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      </section>

      <section className="admin-form-section vietnam-fields">
        <div className="admin-form-heading">
          <span>VIETNAMESE STOREFRONT</span>
          <p>Configure the Vietnamese offer, VND price and all Vietnamese storefront content in one place.</p>
        </div>
        <div className="admin-form-grid">
          <fieldset className="sale-type-field wide-field">
            <legend>Vietnam sales type *</legend>
            <div className="sale-type-options">
              <label className={vietnamSaleType === "free" ? "selected" : ""}>
                <input
                  checked={vietnamSaleType === "free"}
                  name="sale_type_vn"
                  onChange={() => setVietnamSaleType("free")}
                  type="radio"
                  value="free"
                />
                <span>
                  <strong>Free in Vietnam</strong>
                  <small>Vietnamese customers enter an email and receive the Skill without payment.</small>
                </span>
              </label>
              <label className={vietnamSaleType === "paid" ? "selected" : ""}>
                <input
                  checked={vietnamSaleType === "paid"}
                  name="sale_type_vn"
                  onChange={() => setVietnamSaleType("paid")}
                  type="radio"
                  value="paid"
                />
                <span>
                  <strong>Paid in Vietnam</strong>
                  <small>Vietnamese customers pay through payOS/VietQR at the VND price below.</small>
                </span>
              </label>
            </div>
          </fieldset>
          <label className="wide-field">
            <span>Vietnamese Skill name *</span>
            <input defaultValue={skill?.name} maxLength={120} name="name" required />
          </label>
          <label>
            <span>Vietnamese category *</span>
            <input defaultValue={skill?.category} name="category" placeholder="Aquascape" required />
          </label>
          {vietnamSaleType === "free" ? (
            <div className="sale-type-summary wide-field free">
              <strong>Free delivery is active in Vietnam</strong>
              <span>The Vietnamese storefront will display “Miễn phí” and deliver the file by email.</span>
              <input name="price" type="hidden" value="0" />
              <input name="discount_percent_vn" type="hidden" value="0" />
            </div>
          ) : (
            <>
              <label>
                <span>Vietnam original price (VND) *</span>
                <input
                  defaultValue={skill?.price && skill.price > 0 ? skill.price : ""}
                  min={1000}
                  name="price"
                  placeholder="100000"
                  step={1000}
                  type="number"
                  required
                />
                <small>The price before discount. It remains independent from the international USD price.</small>
              </label>
              <label className="discount-field">
                <span>Vietnam discount (%)</span>
                <input
                  defaultValue={skill?.discount_percent_vn ?? 0}
                  max={99}
                  min={0}
                  name="discount_percent_vn"
                  placeholder="0"
                  step={1}
                  type="number"
                />
                <small>Enter 0 for no discount. The payOS amount will use the discounted price.</small>
              </label>
            </>
          )}
          <label className="wide-field">
            <span>Vietnamese eyebrow</span>
            <input defaultValue={skill?.eyebrow} name="eyebrow" />
          </label>
          <label className="wide-field">
            <span>Vietnamese card description *</span>
            <textarea defaultValue={skill?.short_description} name="short_description" required rows={3} />
          </label>
          <label className="wide-field">
            <span>Vietnamese full description *</span>
            <textarea defaultValue={skill?.description} name="description" required rows={6} />
          </label>
          <label>
            <span>Vietnamese outcomes</span>
            <textarea defaultValue={lines(skill?.outcomes)} name="outcomes" rows={7} />
          </label>
          <label>
            <span>Vietnamese deliverables</span>
            <textarea defaultValue={lines(skill?.deliverables)} name="deliverables" rows={7} />
          </label>
          <label>
            <span>Vietnamese requirements</span>
            <textarea defaultValue={lines(skill?.requirements)} name="requirements" rows={7} />
          </label>
        </div>
      </section>

      <section className="admin-form-section international-fields">
        <div className="admin-form-heading">
          <span>INTERNATIONAL STOREFRONT</span>
          <p>Choose how this Skill is offered, then add its English content. Leave the English name blank to keep it off the international store.</p>
        </div>
        <div className="admin-form-grid">
          <fieldset className="sale-type-field wide-field">
            <legend>Sales type *</legend>
            <div className="sale-type-options">
              <label className={internationalSaleType === "free" ? "selected" : ""}>
                <input
                  checked={internationalSaleType === "free"}
                  name="sale_type_international"
                  onChange={() => setInternationalSaleType("free")}
                  type="radio"
                  value="free"
                />
                <span>
                  <strong>Free Skill</strong>
                  <small>Customer enters an email address and receives a private download link. No payment.</small>
                </span>
              </label>
              <label className={internationalSaleType === "paid" ? "selected" : ""}>
                <input
                  checked={internationalSaleType === "paid"}
                  name="sale_type_international"
                  onChange={() => setInternationalSaleType("paid")}
                  type="radio"
                  value="paid"
                />
                <span>
                  <strong>Paid Skill</strong>
                  <small>The international store uses the approved payment provider configured on Vercel.</small>
                </span>
              </label>
            </div>
          </fieldset>
          <label className="wide-field">
            <span>English Skill name</span>
            <input defaultValue={skill?.name_en ?? ""} maxLength={120} name="name_en" />
          </label>
          <label>
            <span>English category</span>
            <input defaultValue={skill?.category_en ?? ""} name="category_en" placeholder="Model Assembly" />
          </label>
          {internationalSaleType === "free" ? (
            <div className="sale-type-summary wide-field free">
              <strong>Free delivery is active</strong>
              <span>The uploaded Skill file will be sent by email. The storefront price will display as Free.</span>
              <input name="discount_percent_international" type="hidden" value="0" />
            </div>
          ) : (
            <>
              <label>
                <span>International original price (USD) *</span>
                <input
                  defaultValue={skill?.price_usd_cents == null ? "" : skill.price_usd_cents / 100}
                  min="0.01"
                  name="price_usd"
                  placeholder="9.00"
                  step="0.01"
                  type="number"
                />
                <small>The price before discount. PayPal receives the discounted amount automatically.</small>
              </label>
              <label className="discount-field">
                <span>International discount (%)</span>
                <input
                  defaultValue={skill?.discount_percent_international ?? 0}
                  max={99}
                  min={0}
                  name="discount_percent_international"
                  placeholder="0"
                  step={1}
                  type="number"
                />
                <small>Enter 0 for no discount. This setting is independent from the Vietnam discount.</small>
              </label>
            </>
          )}
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
