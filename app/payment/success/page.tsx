import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getStoreOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const query = await searchParams;
  if (!query.order) notFound();
  const { order, item } = await getStoreOrder(query.order);
  if (!order || !item) notFound();
  if (order.status !== "paid") redirect(`/payment/${encodeURIComponent(order.order_code)}`);

  return (
    <><SiteHeader /><main className="success-page shell"><section className="success-card"><div className="success-mark">✓</div><span className="section-index">PAYMENT CONFIRMED</span><h1>Your Skill is on its way.</h1><p>Reference <strong>{order.order_code}</strong> for <strong>{item.skill_name}</strong> has been verified. A private download link is being sent to the email you entered. If it does not arrive, check Spam or Junk before contacting support.</p><div className="success-actions"><Link className="primary-button" href="/skills">Explore more Skills <span>→</span></Link><Link className="secondary-button" href="/support">Need help?</Link></div></section></main><SiteFooter /></>
  );
}
