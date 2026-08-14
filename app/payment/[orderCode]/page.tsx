import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PaymentStatus } from "@/components/payment-status";
import { CopyValueButton } from "@/components/copy-value-button";
import { formatVnd, maskEmail } from "@/lib/format";
import { getOrderTransferContent, getStoreOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

async function createQrImage(value: string | null) {
  if (!value) return null;
  try {
    return await QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 1, width: 520 });
  } catch {
    return null;
  }
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderCode: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const [{ orderCode }, query] = await Promise.all([params, searchParams]);
  const { order, item } = await getStoreOrder(orderCode);
  if (!order || !item) notFound();
  if (order.status === "paid") redirect(`/payment/success?order=${encodeURIComponent(order.order_code)}`);

  const qrImage = await createQrImage(order.qr_code_data);
  const canPay = order.status === "pending";
  const transferContent = getOrderTransferContent(order);

  return (
    <><SiteHeader /><main className="payment-page shell">
      <section className="payment-card">
        <div className="payment-heading"><div><span className="section-index">LEGACY LOCAL PAYMENT</span><h1>Scan to complete the transfer.</h1></div><PaymentStatus orderCode={order.order_code} initialStatus={order.status} /></div>
        {query.cancelled === "1" ? <div className="payment-cancel-note">You returned from the payment page. This order will remain pending until it expires.</div> : null}
        <div className="payment-grid">
          <div className="qr-placeholder">
            {qrImage && canPay ? <img className="payment-qr-image" src={qrImage} alt={`Payment QR for order ${order.order_code}`} /> : <div className="qr-unavailable">QR no longer available</div>}
            <small>The amount and required transfer reference are pre-filled.</small>
          </div>
          <div className="payment-info">
            <dl>
              <div><dt>Order reference</dt><dd>{order.order_code}</dd></div>
              <div><dt>Product</dt><dd>{item.skill_name}</dd></div>
              <div><dt>Amount</dt><dd>{formatVnd(order.total)}</dd></div>
              <div><dt>Deliver to</dt><dd>{maskEmail(order.customer_email)}</dd></div>
              <div className="payment-transfer-row">
                <dt>Required reference</dt>
                <dd className="payment-transfer-value">
                  <code>{transferContent}</code>
                  {transferContent ? (
                    <CopyValueButton
                      copiedLabel="Reference copied"
                      label="Copy"
                      value={transferContent}
                    />
                  ) : null}
                </dd>
              </div>
            </dl>
            <div className="payment-transfer-warning" role="alert">
              <strong>Do not change the transfer reference</strong>
              <p>
                Keep <b>{transferContent}</b> exactly as shown. Do not edit, remove or add any
                character, or the system may not recognize the order and automatic delivery may fail.
              </p>
            </div>
            <div className="payment-note"><strong>Transfer the exact amount shown</strong><p>This page updates automatically after the provider confirms the transaction.</p></div>
            {order.checkout_url && canPay ? <a className="secondary-button full-button payos-link" href={order.checkout_url} target="_blank" rel="noreferrer">Open secure payment page ↗</a> : null}
          </div>
        </div>
        <div className="prototype-note">Keep this page open during the transfer. If your bank confirms payment, allow a few seconds for verification.</div>
        <Link className="back-link payment-back-link" href={`/skills/${item.skill_slug}`}>← Back to Skill</Link>
      </section>
    </main><SiteFooter /></>
  );
}
