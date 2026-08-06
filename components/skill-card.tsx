import Link from "next/link";
import { formatVnd } from "@/lib/format";
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
          <span>{skill.version}</span>
        </div>
        <h2><Link href={`/skills/${skill.slug}`}>{skill.name}</Link></h2>
        <p>{skill.shortDescription}</p>
        <div className="card-bottom">
          <strong>{formatVnd(skill.price)}</strong>
          <Link className="text-link" href={`/skills/${skill.slug}`}>
            Xem chi tiết <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
