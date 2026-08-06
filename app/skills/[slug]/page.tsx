import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VideoPreview } from "@/components/video-preview";
import { formatVnd } from "@/lib/format";
import { getCatalogSkill } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SkillDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = await getCatalogSkill(slug);
  if (!skill) notFound();
  return (
    <><SiteHeader /><main>
      <section className="detail-hero shell">
        <div className="detail-copy">
          <Link className="back-link" href="/skills">← Kho Skill</Link>
          <div className="card-meta"><span>{skill.category}</span><span>{skill.version}</span></div>
          <h1>{skill.name}</h1>
          <p className="detail-eyebrow">{skill.eyebrow}</p>
          <p className="detail-description">{skill.description}</p>
          <div className="detail-buy-row"><strong>{formatVnd(skill.price)}</strong><Link className="primary-button" href={`/checkout/${skill.slug}`}>Mua Skill <span>→</span></Link></div>
          <small>Thanh toán VietQR • Gửi tự động qua email</small>
        </div>
        <VideoPreview id={`detail-${skill.slug}`} src={skill.videoSrc} label={skill.name} accent={skill.accent} accentSoft={skill.accentSoft} detail />
      </section>
      <section className="detail-content shell">
        <article><span className="section-index">KẾT QUẢ</span><h2>Skill giúp bạn kiểm soát điều gì?</h2><ul>{skill.outcomes.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span className="section-index">BẠN NHẬN ĐƯỢC</span><h2>Gói bàn giao rõ ràng.</h2><ul>{skill.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span className="section-index">YÊU CẦU</span><h2>Chuẩn bị trước khi dùng.</h2><ul>{skill.requirements.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </section>
      <section className="detail-cta shell"><div><span>Đã xem đủ thông tin?</span><h2>Nhận Skill trong email sau khi thanh toán.</h2></div><Link className="primary-button inverse" href={`/checkout/${skill.slug}`}>Tiếp tục mua <span>→</span></Link></section>
    </main><SiteFooter /></>
  );
}
