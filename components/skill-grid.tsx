import type { SkillProduct } from "@/lib/types";
import { SkillCard } from "@/components/skill-card";
import type { StoreLocale } from "@/lib/locale";

export function SkillGrid({ items, locale }: { items: SkillProduct[]; locale: StoreLocale }) {
  return (
    <div className="skill-grid">
      {items.map((skill, index) => <SkillCard key={skill.slug} locale={locale} skill={skill} priority={index < 3} />)}
    </div>
  );
}
