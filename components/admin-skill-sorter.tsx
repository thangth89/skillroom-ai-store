"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  deleteSkill,
  reorderSkills,
  type SkillOrderActionState,
} from "@/app/admin/skills/actions";
import { formatUsdCents, formatVnd } from "@/lib/format";
import { applyPercentageDiscount, normalizeDiscountPercent } from "@/lib/pricing";
import type { SkillRecord, SkillStatus } from "@/lib/supabase/skill-records";

const initialState: SkillOrderActionState = {
  error: "",
  success: "",
  savedIds: null,
};

const statusLabel: Record<SkillStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

function moveItem(ids: string[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= ids.length || to >= ids.length) return ids;
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function AdminSkillSorter({
  skills,
  sortReady,
}: {
  skills: SkillRecord[];
  sortReady: boolean;
}) {
  const initialIds = useMemo(() => skills.map((skill) => skill.id), [skills]);
  const skillById = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [skills]);
  const [orderedIds, setOrderedIds] = useState(initialIds);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState({ error: "", success: "" });
  const [deletePending, startDeleteTransition] = useTransition();
  const [state, formAction, pending] = useActionState(reorderSkills, initialState);
  const router = useRouter();

  useEffect(() => setOrderedIds(initialIds), [initialIds]);

  const savedIds = (state.savedIds ?? initialIds).filter((id) => skillById.has(id));
  const hasChanges = orderedIds.join("|") !== savedIds.join("|");

  function move(id: string, to: number) {
    setOrderedIds((current) => moveItem(current, current.indexOf(id), to));
  }

  function dropBefore(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    setOrderedIds((current) => {
      const from = current.indexOf(draggedId);
      const target = current.indexOf(targetId);
      const adjustedTarget = from < target ? target - 1 : target;
      return moveItem(current, from, adjustedTarget);
    });
    setDraggedId(null);
  }

  function removeSkill(id: string, name: string) {
    const confirmed = window.confirm(
      `Delete “${name}” permanently? The product will disappear from both storefronts. This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(id);
    setDeleteMessage({ error: "", success: "" });
    const formData = new FormData();
    formData.set("id", id);
    startDeleteTransition(async () => {
      const result = await deleteSkill(formData);
      if (result.error) {
        setDeleteMessage({ error: result.error, success: "" });
      } else {
        setOrderedIds((current) => current.filter((skillId) => skillId !== id));
        setDeleteMessage({ error: "", success: result.success });
        router.refresh();
      }
      setDeletingId(null);
    });
  }

  return (
    <form action={formAction} className="skill-sorter">
      <input name="skill_ids" type="hidden" value={JSON.stringify(orderedIds)} />

      {!sortReady ? (
        <div className="skill-sort-migration">
          Skill ordering is not enabled in Supabase. The store is using its fallback order; run
          migration <strong>202608060002_skill_sort_order.sql</strong> to enable saving.
        </div>
      ) : null}
      {state.error ? <div className="skill-sort-message error">{state.error}</div> : null}
      {deleteMessage.error ? <div className="skill-sort-message error">{deleteMessage.error}</div> : null}
      {deleteMessage.success ? <div className="skill-sort-message success">{deleteMessage.success}</div> : null}
      {state.success && !hasChanges ? (
        <div className="skill-sort-message success">{state.success}</div>
      ) : null}

      <div className="skill-sort-toolbar">
        <p>
          Drag Skills or use the arrow buttons. Position 01 appears first on the homepage and on
          the first page of the international catalog.
        </p>
        <button
          className="primary-button"
          disabled={!sortReady || pending || !hasChanges}
          type="submit"
        >
          {pending ? "Saving…" : hasChanges ? "Save order" : "Order saved"}
        </button>
      </div>

      <div className="skill-sort-table">
        <div className="skill-sort-row skill-sort-head">
          <span>Position</span>
          <span>Skill</span>
          <span>Category</span>
          <span>Vietnam / International</span>
          <span>Status / Controls</span>
        </div>

        {orderedIds.map((id, index) => {
          const skill = skillById.get(id);
          if (!skill) return null;
          const disabled = pending || deletePending || !sortReady;
          const displayName = skill.name_en?.trim() || skill.name;
          const displayCategory = skill.category_en?.trim() || skill.category;
          const vietnamIsFree = skill.price === 0;
          const vietnamDiscount = vietnamIsFree
            ? 0
            : normalizeDiscountPercent(skill.discount_percent_vn);
          const vietnamSalePrice = applyPercentageDiscount(skill.price, vietnamDiscount);
          const internationalDiscount = skill.is_free
            ? 0
            : normalizeDiscountPercent(skill.discount_percent_international);
          const internationalSalePrice = skill.price_usd_cents == null
            ? null
            : applyPercentageDiscount(skill.price_usd_cents, internationalDiscount);
          const internationalPrice = skill.is_free
            ? "Free"
            : internationalSalePrice == null
              ? "Not set"
              : formatUsdCents(internationalSalePrice);

          return (
            <div
              className={`skill-sort-row${draggedId === id ? " dragging" : ""}`}
              draggable={!disabled}
              key={id}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggedId(id)}
              onDrop={() => dropBefore(id)}
            >
              <span className="skill-sort-position">
                <span className="skill-sort-handle" aria-hidden="true">↕</span>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="skill-sort-product">
                <strong>{displayName}</strong>
                <small>{skill.version} · /{skill.slug}</small>
              </span>
              <span>{displayCategory}</span>
              <span className="skill-sales-cell">
                <span className="skill-market-offer">
                  <small>VN</small>
                  <i className={`skill-sales-badge ${vietnamIsFree ? "free" : "paid"}`}>
                    {vietnamIsFree ? "Free" : "Paid"}
                  </i>
                  <span className="skill-market-price">
                    {vietnamDiscount > 0 ? <del>{formatVnd(skill.price)}</del> : null}
                    <strong>{vietnamIsFree ? "0 ₫" : formatVnd(vietnamSalePrice)}</strong>
                    {vietnamDiscount > 0 ? <em>-{vietnamDiscount}%</em> : null}
                  </span>
                </span>
                <span className="skill-market-offer">
                  <small>INTL</small>
                  <i className={`skill-sales-badge ${skill.is_free ? "free" : "paid"}`}>
                    {skill.is_free ? "Free" : "Paid"}
                  </i>
                  <span className="skill-market-price">
                    {internationalDiscount > 0 && skill.price_usd_cents != null
                      ? <del>{formatUsdCents(skill.price_usd_cents)}</del>
                      : null}
                    <strong>{internationalPrice}</strong>
                    {internationalDiscount > 0 ? <em>-{internationalDiscount}%</em> : null}
                  </span>
                </span>
              </span>
              <span className="skill-sort-status">
                <i className={`skill-status ${skill.status}`}>{statusLabel[skill.status]}</i>
                <span className="skill-sort-actions">
                  <Link href={`/admin/skills/${skill.id}`}>Edit</Link>
                  <button
                    className="skill-delete-button"
                    disabled={deletePending}
                    onClick={() => removeSkill(id, displayName)}
                    type="button"
                  >
                    {deletingId === id ? "Deleting…" : "Delete"}
                  </button>
                  <span className="skill-sort-controls">
                    <button
                      aria-label={`Move ${displayName} to the top`}
                      disabled={disabled || index === 0}
                      onClick={() => move(id, 0)}
                      type="button"
                    >
                      Top
                    </button>
                    <button
                      aria-label={`Move ${displayName} up one position`}
                      disabled={disabled || index === 0}
                      onClick={() => move(id, index - 1)}
                      type="button"
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Move ${displayName} down one position`}
                      disabled={disabled || index === orderedIds.length - 1}
                      onClick={() => move(id, index + 1)}
                      type="button"
                    >
                      ↓
                    </button>
                  </span>
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </form>
  );
}
