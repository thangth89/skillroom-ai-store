import Link from "next/link";
import { formatUsdCents } from "@/lib/format";
import type { SkillProduct } from "@/lib/types";
import { VideoPreview } from "@/components/video-preview";

export function SkillCard({ skill, priority = false }: { skill: SkillProduct; priority?: boolean }) {
  return (
    <article className="skill-card">
      <VideoPreview
        id={`card-${skill.slug}`}
        src={skill.videoSrc}
        label={skill.name}
        accent={skill.accent}
        accentSoft={skill.accentSoft}
      />
      <div className="skill-card-body">
        <div className="card-meta">
          <span>{skill.category}</span>
          <span>{skill.isFree ? "FREE SKILL" : skill.version}</span>
        </div>
        <h2><Link href={`/skills/${skill.slug}`}>{skill.name}</Link></h2>
        <p>{skill.shortDescription}</p>
        <div className="card-bottom">
          <strong className={skill.isFree ? "free-price" : ""}>
            {skill.isFree
              ? "Free"
              : skill.priceUsdCents === null
                ? "Coming soon"
                : formatUsdCents(skill.priceUsdCents)}
          </strong>
          <Link className="text-link" href={`/skills/${skill.slug}`}>
            {skill.isFree ? "Get free" : "View details"} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
