import crypto from "node:crypto";
import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type LemonOrderPayload = {
  meta?: { event_name?: string; custom_data?: Record<string, unknown> };
  data?: {
    id?: string;
    attributes?: {
      identifier?: string;
      user_email?: string;
      currency?: string;
      subtotal?: number;
      total?: number;
      status?: string;
      created_at?: string;
      first_order_item?: {
        variant_id?: number;
        product_name?: string;
        variant_name?: string;
        price?: number;
      };
      urls?: { receipt?: string };
    };
  };
};

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");
  return expectedBuffer.length === signatureBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

function integerAmount(value: number | undefined) {
  return Number.isFinite(value) && value! >= 0 ? Math.round(value!) : 0;
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret || !hasAdminDataConfig()) {
    return Response.json({ success: false }, { status: 503 });
  }

  const signature = request.headers.get("x-signature")?.trim();
  const rawBody = await request.text();
  if (!signature || !verifySignature(rawBody, signature, secret)) {
    return Response.json({ success: false }, { status: 401 });
  }

  let payload: LemonOrderPayload;
  try {
    payload = JSON.parse(rawBody) as LemonOrderPayload;
  } catch {
    return Response.json({ success: false }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  if (eventName !== "order_created" && eventName !== "order_refunded") {
    return Response.json({ success: true });
  }

  const providerReference = payload.data?.id?.trim();
  const attributes = payload.data?.attributes;
  if (!providerReference || !attributes) {
    return Response.json({ success: false }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: existingPayment, error: paymentLookupError } = await supabase
    .from("payments")
    .select("id, order_id")
    .eq("provider", "lemonsqueezy")
    .eq("provider_reference", providerReference)
    .maybeSingle<{ id: string; order_id: string }>();

  if (paymentLookupError) return Response.json({ success: false }, { status: 500 });

  if (eventName === "order_refunded") {
    if (!existingPayment) return Response.json({ success: true });
    const [paymentResult, orderResult] = await Promise.all([
      supabase
        .from("payments")
        .update({ status: "REFUNDED", webhook_payload: payload })
        .eq("id", existingPayment.id),
      supabase.from("orders").update({ status: "refunded" }).eq("id", existingPayment.order_id),
    ]);
    const failed = Boolean(paymentResult.error || orderResult.error);
    return Response.json({ success: !failed }, { status: failed ? 500 : 200 });
  }

  if (existingPayment) return Response.json({ success: true });

  const email = attributes.user_email?.trim().toLowerCase();
  const identifier = attributes.identifier?.trim() || providerReference;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ success: false }, { status: 400 });
  }

  const orderCode = `LS-${identifier}`.toUpperCase();
  const subtotal = integerAmount(attributes.subtotal);
  const total = integerAmount(attributes.total);
  const currency = attributes.currency?.trim().toUpperCase() || "USD";
  const paidAt = attributes.created_at || new Date().toISOString();

  const { data: insertedOrder, error: orderInsertError } = await supabase
    .from("orders")
    .insert({
      order_code: orderCode,
      customer_email: email,
      status: "paid",
      currency,
      subtotal,
      total,
      checkout_url: attributes.urls?.receipt || null,
      paid_at: paidAt,
    })
    .select("id")
    .single<{ id: string }>();

  let orderId = insertedOrder?.id ?? null;
  if (orderInsertError) {
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("order_code", orderCode)
      .maybeSingle<{ id: string }>();
    orderId = existingOrder?.id ?? null;
  }
  if (!orderId) return Response.json({ success: false }, { status: 500 });

  const customSlug = payload.meta?.custom_data?.skill_slug;
  const skillSlug = typeof customSlug === "string" && customSlug.trim()
    ? customSlug.trim()
    : `lemonsqueezy-${attributes.first_order_item?.variant_id ?? providerReference}`;
  const { data: skill } = await supabase
    .from("skills")
    .select("id, name, version")
    .eq("slug", skillSlug)
    .maybeSingle<{ id: string; name: string; version: string }>();

  const { data: existingItem } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (!existingItem) {
    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: orderId,
      skill_id: skill?.id ?? null,
      skill_name: attributes.first_order_item?.product_name || skill?.name || "Lemon Squeezy Skill",
      skill_slug: skillSlug,
      version: skill?.version || attributes.first_order_item?.variant_name || "Digital download",
      file_path: null,
      unit_price: integerAmount(attributes.first_order_item?.price ?? attributes.subtotal),
      quantity: 1,
    });
    if (itemError) return Response.json({ success: false }, { status: 500 });
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    order_id: orderId,
    provider: "lemonsqueezy",
    provider_reference: providerReference,
    amount: total,
    status: (attributes.status || "paid").toUpperCase(),
    webhook_payload: payload,
  });

  return Response.json({ success: !paymentError }, { status: paymentError ? 500 : 200 });
}
