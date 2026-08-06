import type { Webhook } from "@payos/node";
import { sendOrderDeliveryEmail } from "@/lib/delivery";
import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";
import { getPayOSClient, hasPayOSConfig } from "@/lib/payos";

export async function POST(request: Request) {
  if (!hasAdminDataConfig() || !hasPayOSConfig()) {
    return Response.json({ success: false }, { status: 503 });
  }

  let body: Webhook;
  try {
    body = (await request.json()) as Webhook;
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }

  try {
    const verified = await getPayOSClient().webhooks.verify(body);

    // payOS gửi dữ liệu thử khi đăng ký webhook; xác nhận hợp lệ dù chưa có đơn tương ứng.
    if (!body.success || verified.code !== "00") {
      return Response.json({ success: true });
    }

    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total, status")
      .eq("payos_order_code", verified.orderCode)
      .maybeSingle<{ id: string; total: number; status: string }>();

    if (orderError) return Response.json({ success: false }, { status: 500 });
    if (!order) return Response.json({ success: true });

    const paymentStatus = verified.amount === order.total ? "PAID" : "AMOUNT_MISMATCH";
    const { data: payment } = await supabase
      .from("payments")
      .select("id")
      .eq("order_id", order.id)
      .eq("provider", "payos")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    const paymentResult = payment
      ? await supabase
        .from("payments")
        .update({
          provider_reference: verified.paymentLinkId,
          amount: verified.amount,
          status: paymentStatus,
          webhook_payload: body,
        })
        .eq("id", payment.id)
      : await supabase.from("payments").insert({
          order_id: order.id,
          provider: "payos",
          provider_reference: verified.paymentLinkId,
          amount: verified.amount,
          status: paymentStatus,
          webhook_payload: body,
        });

    if (paymentResult.error) {
      return Response.json({ success: false }, { status: 500 });
    }

    if (paymentStatus !== "PAID" || order.status === "refunded") {
      return Response.json({ success: true });
    }

    if (order.status !== "paid") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payos_payment_link_id: verified.paymentLinkId,
        })
        .eq("id", order.id)
        .neq("status", "refunded");

      if (updateError) return Response.json({ success: false }, { status: 500 });
    }

    try {
      await sendOrderDeliveryEmail({
        orderId: order.id,
        origin: new URL(request.url).origin,
      });
    } catch (error) {
      console.error("Không thể bàn giao Skill qua email:", error);
      // Trả 500 để payOS thử gửi lại webhook; Resend chống gửi trùng bằng idempotency key.
      return Response.json({ success: false }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }
}
