"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  reorderSkills,
  type SkillOrderActionState,
} from "@/app/admin/skills/actions";
import { formatUsdCents } from "@/lib/format";
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
  const [state, formAction, pending] = useActionState(reorderSkills, initialState);

  const savedIds = state.savedIds ?? initialIds;
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
          <span>International price</span>
          <span>Status / Controls</span>
        </div>

        {orderedIds.map((id, index) => {
          const skill = skillById.get(id);
          if (!skill) return null;
          const disabled = pending || !sortReady;
          const displayName = skill.name_en?.trim() || skill.name;
          const displayCategory = skill.category_en?.trim() || skill.category;
          const displayPrice = skill.is_free
            ? "Free"
            : skill.price_usd_cents == null
              ? "Not set"
              : formatUsdCents(skill.price_usd_cents);

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
              <span>{displayPrice}</span>
              <span className="skill-sort-status">
                <i className={`skill-status ${skill.status}`}>{statusLabel[skill.status]}</i>
                <Link href={`/admin/skills/${skill.id}`}>Edit</Link>
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
            </div>
          );
        })}
      </div>
    </form>
  );
}
