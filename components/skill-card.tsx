import Link from "next/link";
import type { StoreLocale } from "@/lib/locale";
import type { SkillProduct } from "@/lib/types";
import { StorePrice } from "@/components/store-price";
import { VideoPreview } from "@/components/video-preview";

export function SkillCard({ skill, locale, priority = false }: { skill: SkillProduct; locale: StoreLocale; priority?: boolean }) {
  const vi = locale === "vi";
  return (
    <article className="skill-card">
      <VideoPreview
        id={`card-${skill.slug}`}
        src={skill.videoSrc}
        label={skill.name}
        accent={skill.accent}
        accentSoft={skill.accentSoft}
        locale={locale}
      />
      <div className="skill-card-body">
        <div className="card-meta">
          <span>{skill.category}</span>
          <span>{skill.isFree ? (vi ? "MIỄN PHÍ" : "FREE SKILL") : skill.version}</span>
        </div>
        <h2><Link href={`/skills/${skill.slug}`}>{skill.name}</Link></h2>
        <p>{skill.shortDescription}</p>
        <div className="card-bottom">
          <StorePrice locale={locale} skill={skill} variant="card" />
          <Link className="text-link" href={`/skills/${skill.slug}`}>
            {vi ? "Xem chi tiết" : skill.isFree ? "Get free" : "View details"} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
