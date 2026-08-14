import { revokeOrderDownloadLinks, sendOrderDeliveryEmail } from "@/lib/delivery";
import { hasPayPalConfig, verifyPayPalWebhook } from "@/lib/paypal";
import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";

type PayPalWebhook = {
  event_type?: string;
  resource?: {
    status?: string;
    amount?: { currency_code?: string; value?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
};

type PaymentRow = { id: string; order_id: string; amount: number; status: string };
type OrderRow = { id: string; status: string; total: number; currency: string };

function requiredHeader(request: Request, name: string) {
  return request.headers.get(name)?.trim() || "";
}

function amountCents(value: string | undefined) {
  return value && /^\d+(?:\.\d{1,2})?$/.test(value) ? Math.round(Number(value) * 100) : -1;
}

export async function POST(request: Request) {
  if (!hasAdminDataConfig() || !hasPayPalConfig() || !process.env.PAYPAL_WEBHOOK_ID?.trim()) {
    return Response.json({ success: false, error: "PayPal webhook is not configured." }, { status: 503 });
  }

  let event: PayPalWebhook;
  try {
    event = (await request.json()) as PayPalWebhook;
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }

  const signature = {
    authAlgo: requiredHeader(request, "paypal-auth-algo"),
    certUrl: requiredHeader(request, "paypal-cert-url"),
    transmissionId: requiredHeader(request, "paypal-transmission-id"),
    transmissionSig: requiredHeader(request, "paypal-transmission-sig"),
    transmissionTime: requiredHeader(request, "paypal-transmission-time"),
  };
  if (Object.values(signature).some((value) => !value)) {
    return Response.json({ success: false }, { status: 400 });
  }

  try {
    const verification = await verifyPayPalWebhook({ ...signature, webhookEvent: event });
    if (verification.verification_status !== "SUCCESS") {
      return Response.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    console.error("PayPal webhook verification failed:", error);
    return Response.json({ success: false }, { status: 401 });
  }

  const paypalOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
  if (!paypalOrderId) return Response.json({ success: true });

  const supabase = createAdminClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, order_id, amount, status")
    .eq("provider", "paypal")
    .eq("provider_reference", paypalOrderId)
    .maybeSingle<PaymentRow>();
  if (paymentError) return Response.json({ success: false }, { status: 500 });
  if (!payment) return Response.json({ success: true });

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, total, currency")
    .eq("id", payment.order_id)
    .maybeSingle<OrderRow>();
  if (orderError) return Response.json({ success: false }, { status: 500 });
  if (!order) return Response.json({ success: true });

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    if (order.status === "refunded") return Response.json({ success: true });
    const validAmount = event.resource?.status === "COMPLETED" &&
      event.resource.amount?.currency_code === "USD" &&
      amountCents(event.resource.amount.value) === order.total &&
      payment.amount === order.total &&
      order.currency === "USD";
    if (!validAmount) {
      await supabase.from("payments").update({ status: "AMOUNT_MISMATCH", webhook_payload: event }).eq("id", payment.id);
      return Response.json({ success: false }, { status: 409 });
    }

    const [paymentUpdate, orderUpdate] = await Promise.all([
      payment.status === "COMPLETED_DELIVERED"
        ? supabase.from("payments").update({ webhook_payload: event }).eq("id", payment.id)
        : supabase.from("payments").update({ status: "COMPLETED", webhook_payload: event }).eq("id", payment.id),
      supabase.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id).neq("status", "refunded"),
    ]);
    if (paymentUpdate.error || orderUpdate.error) {
      return Response.json({ success: false }, { status: 500 });
    }

    if (payment.status !== "COMPLETED_DELIVERED") {
      try {
        const result = await sendOrderDeliveryEmail({ orderId: order.id, origin: new URL(request.url).origin });
        if (result.status === "sent") {
          await supabase.from("payments").update({ status: "COMPLETED_DELIVERED" }).eq("id", payment.id);
        }
      } catch (error) {
        console.error("PayPal webhook delivery failed:", error);
        return Response.json({ success: false }, { status: 500 });
      }
    }
  }

  if (event.event_type === "PAYMENT.CAPTURE.REFUNDED" || event.event_type === "PAYMENT.CAPTURE.REVERSED") {
    const reversed = event.event_type.endsWith("REVERSED");
    const fullRefund = reversed || (
      event.resource?.amount?.currency_code === "USD" &&
      amountCents(event.resource.amount.value) >= order.total
    );
    const paymentStatus = reversed ? "REVERSED" : fullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";
    const paymentUpdate = await supabase
      .from("payments")
      .update({ status: paymentStatus, webhook_payload: event })
      .eq("id", payment.id);
    if (paymentUpdate.error) return Response.json({ success: false }, { status: 500 });

    if (fullRefund) {
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ status: "refunded" })
        .eq("id", order.id);
      if (orderUpdateError) return Response.json({ success: false }, { status: 500 });
      try {
        await revokeOrderDownloadLinks(order.id);
      } catch (error) {
        console.error("Unable to revoke download links after PayPal refund:", error);
      }
    }
  }

  return Response.json({ success: true });
}
