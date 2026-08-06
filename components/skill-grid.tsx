import type { SkillProduct } from "@/lib/types";
import { SkillCard } from "@/components/skill-card";

export function SkillGrid({ items }: { items: SkillProduct[] }) {
  return (
    <div className="skill-grid">
      {items.map((skill, index) => <SkillCard key={skill.slug} skill={skill} priority={index < 3} />)}
    </div>
  );
}
