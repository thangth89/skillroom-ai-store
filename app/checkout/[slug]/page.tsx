import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CheckoutForm } from "@/components/checkout-form";
import { formatVnd } from "@/lib/format";
import { getSkill, skills } from "@/lib/skills";

export function generateStaticParams() { return skills.map((skill) => ({ slug: skill.slug })); }

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const skill = getSkill(slug);
  if (!skill) notFound();
  return (
    <><SiteHeader /><main className="checkout-page shell">
      <div className="checkout-main"><Link className="back-link" href={`/skills/${skill.slug}`}>← Quay lại chi tiết</Link><span className="section-index">THANH TOÁN / BƯỚC 1</span><h1>Email nhận Skill.</h1><p>Hãy dùng email bạn đang truy cập được. Link tải sẽ được gửi đến đây sau khi giao dịch được xác nhận.</p><CheckoutForm slug={skill.slug} /></div>
      <aside className="order-summary"><span>TÓM TẮT ĐƠN HÀNG</span><div className="summary-preview" style={{ "--accent": skill.accent, "--accent-soft": skill.accentSoft } as React.CSSProperties}><small>{skill.category}</small><strong>{skill.name}</strong><em>{skill.version}</em></div><div className="summary-line"><span>Giá Skill</span><strong>{formatVnd(skill.price)}</strong></div><div className="summary-line"><span>Phí xử lý</span><strong>0 ₫</strong></div><div className="summary-total"><span>Tổng thanh toán</span><strong>{formatVnd(skill.price)}</strong></div><p>Sản phẩm số không vận chuyển vật lý.</p></aside>
    </main><SiteFooter /></>
  );
}
