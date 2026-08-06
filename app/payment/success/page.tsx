import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSkill } from "@/lib/skills";

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string; skill?: string }> }) {
  const query = await searchParams;
  const skill = getSkill(query.skill || "") ?? getSkill("nature-aquascape-v22")!;
  return (
    <><SiteHeader /><main className="success-page shell"><section className="success-card"><div className="success-mark">✓</div><span className="section-index">THANH TOÁN THÀNH CÔNG</span><h1>Skill đang trên đường tới email.</h1><p>Đơn <strong>{query.order || "SK00000000"}</strong> cho <strong>{skill.name}</strong> đã được xác nhận. Hãy kiểm tra cả hộp thư quảng cáo hoặc spam nếu chưa thấy email sau vài phút.</p><div className="success-actions"><Link className="primary-button" href="/skills">Xem thêm Skill <span>→</span></Link><Link className="secondary-button" href="/support">Cần hỗ trợ?</Link></div></section></main><SiteFooter /></>
  );
}
