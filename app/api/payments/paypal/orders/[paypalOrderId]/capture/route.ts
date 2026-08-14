import { hasEmailDeliveryConfig, sendOrderDeliveryEmail } from "@/lib/delivery";
import { capturePayPalOrder, hasPayPalConfig, type PayPalOrderResponse } from "@/lib/paypal";
import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";

type PaymentRow = { id: string; order_id: string; amount: number; status: string };
type OrderRow = { id: string; order_code: string; status: string; total: number; currency: string };

function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

function verifiedCapture(payload: PayPalOrderResponse, order: OrderRow) {
  const purchaseUnit = payload.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.find((item) => item.status === "COMPLETED");
  const amount = capture?.amount ?? purchaseUnit?.amount;
  const cents = amount?.value && /^\d+(?:\.\d{1,2})?$/.test(amount.value)
    ? Math.round(Number(amount.value) * 100)
    : -1;
  return payload.status === "COMPLETED" &&
    purchaseUnit?.custom_id === order.id &&
    purchaseUnit?.invoice_id === order.order_code &&
    amount?.currency_code === "USD" &&
    cents === order.total;
}

export async function POST(request: Request, { params }: { params: Promise<{ paypalOrderId: string }> }) {
  if (!hasPayPalConfig() || !hasAdminDataConfig()) {
    return Response.json({ error: "PayPal checkout is not configured yet." }, { status: 503 });
  }

  const { paypalOrderId } = await params;
  if (!/^[A-Z0-9]{8,32}$/i.test(paypalOrderId)) {
    return Response.json({ error: "The PayPal order ID is invalid." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, order_id, amount, status")
    .eq("provider", "paypal")
    .eq("provider_reference", paypalOrderId)
    .maybeSingle<PaymentRow>();
  if (paymentError || !payment) {
    return Response.json({ error: "This PayPal order was not found." }, { status: 404 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_code, status, total, currency")
    .eq("id", payment.order_id)
    .maybeSingle<OrderRow>();
  if (orderError || !order || order.currency !== "USD" || payment.amount !== order.total) {
    return Response.json({ error: "The order could not be verified." }, { status: 409 });
  }
  if (order.status === "refunded" || payment.status === "REFUNDED" || payment.status === "REVERSED") {
    return Response.json({ error: "This order has been refunded and cannot be delivered." }, { status: 409 });
  }

  let capture: PayPalOrderResponse | null = null;
  const paymentCompleted = payment.status === "COMPLETED" || payment.status === "COMPLETED_DELIVERED";
  if (!paymentCompleted) {
    try {
      capture = await capturePayPalOrder(paypalOrderId, `capture-${order.id}`);
    } catch (error) {
      console.error("Unable to capture PayPal order:", error);
      return Response.json({ error: "PayPal could not complete the payment. No delivery was made." }, { status: 502 });
    }

    if (!verifiedCapture(capture, order)) {
      await supabase.from("payments").update({ status: "AMOUNT_MISMATCH", webhook_payload: capture }).eq("id", payment.id);
      return Response.json({ error: "The PayPal payment details did not match this order." }, { status: 409 });
    }

    const [paymentUpdate, orderUpdate] = await Promise.all([
      supabase.from("payments").update({ status: "COMPLETED", webhook_payload: capture }).eq("id", payment.id).neq("status", "COMPLETED_DELIVERED"),
      supabase.from("orders").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", order.id).neq("status", "refunded"),
    ]);
    if (paymentUpdate.error || orderUpdate.error) {
      return Response.json({ error: "Payment succeeded, but the order status could not be saved. Contact support with your PayPal receipt." }, { status: 500 });
    }
  } else if (order.status !== "paid") {
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", order.id)
      .neq("status", "refunded");
    if (orderUpdateError) {
      return Response.json({ error: "Payment succeeded, but the order status could not be restored. Contact support with your PayPal receipt." }, { status: 500 });
    }
  }

  const { data: latestPayment } = await supabase
    .from("payments")
    .select("status")
    .eq("id", payment.id)
    .maybeSingle<{ status: string }>();
  let delivery: "sent" | "pending" = "pending";
  if (hasEmailDeliveryConfig() && latestPayment?.status !== "COMPLETED_DELIVERED") {
    try {
      const result = await sendOrderDeliveryEmail({ orderId: order.id, origin: siteOrigin(request) });
      if (result.status === "sent") {
        delivery = "sent";
        await supabase.from("payments").update({ status: "COMPLETED_DELIVERED" }).eq("id", payment.id);
      }
    } catch (error) {
      console.error("PayPal payment succeeded but email delivery failed:", error);
    }
  } else if (latestPayment?.status === "COMPLETED_DELIVERED") {
    delivery = "sent";
  }

  return Response.json({ success: true, orderCode: order.order_code, delivery });
}
