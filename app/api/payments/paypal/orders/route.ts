import { createPayPalOrder, hasPayPalConfig } from "@/lib/paypal";
import { applyPercentageDiscount } from "@/lib/pricing";
import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";

type PaidInternationalSkill = {
  id: string;
  slug: string;
  name: string;
  name_en: string | null;
  version: string;
  file_path: string;
  price_usd_cents: number;
  discount_percent_international?: number;
  is_free: boolean;
};

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function missingDiscountColumn(error: { code?: string; message?: string } | null) {
  return (
    (error?.code === "PGRST204" || error?.code === "42703") &&
    error?.message?.toLowerCase().includes("discount_percent_international") === true
  );
}

export async function POST(request: Request) {
  if (!hasPayPalConfig() || !hasAdminDataConfig()) {
    return Response.json({ error: "PayPal checkout is not configured yet." }, { status: 503 });
  }

  let body: { email?: unknown; slug?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "The request is not valid." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : body.email;
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!validEmail(email) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return Response.json({ error: "Enter a valid delivery email." }, { status: 400 });
  }

  const supabase = createAdminClient();
  let { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("id, slug, name, name_en, version, file_path, price_usd_cents, discount_percent_international, is_free")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_free", false)
    .not("name_en", "is", null)
    .not("file_path", "is", null)
    .maybeSingle<PaidInternationalSkill>();

  // Keep existing PayPal checkouts available until the discount migration is applied.
  if (missingDiscountColumn(skillError)) {
    const fallback = await supabase
      .from("skills")
      .select("id, slug, name, name_en, version, file_path, price_usd_cents, is_free")
      .eq("slug", slug)
      .eq("status", "published")
      .eq("is_free", false)
      .not("name_en", "is", null)
      .not("file_path", "is", null)
      .maybeSingle<PaidInternationalSkill>();
    skill = fallback.data;
    skillError = fallback.error;
  }

  if (skillError || !skill?.file_path || !skill.name_en?.trim() || skill.price_usd_cents <= 0) {
    return Response.json({ error: "This Skill is not available for international purchase." }, { status: 404 });
  }

  const checkoutPrice = applyPercentageDiscount(
    skill.price_usd_cents,
    skill.discount_percent_international,
  );

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_email", email)
    .eq("currency", "USD")
    .eq("status", "pending")
    .gte("created_at", oneHourAgo);
  if ((count ?? 0) >= 8) {
    return Response.json({ error: "Too many checkout attempts. Please wait and try again." }, { status: 429 });
  }

  const orderCode = `PP-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_code: orderCode,
      customer_email: email,
      status: "pending",
      currency: "USD",
      subtotal: checkoutPrice,
      total: checkoutPrice,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    return Response.json({ error: "We could not prepare this order." }, { status: 500 });
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    skill_id: skill.id,
    skill_name: skill.name_en.trim(),
    skill_slug: skill.slug,
    version: skill.version,
    file_path: skill.file_path,
    unit_price: checkoutPrice,
    quantity: 1,
  });
  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "We could not prepare this order." }, { status: 500 });
  }

  try {
    const paypalOrder = await createPayPalOrder({
      localOrderId: order.id,
      orderCode,
      skillName: skill.name_en.trim(),
      amountCents: checkoutPrice,
    });
    if (!paypalOrder.id) throw new Error("PayPal did not return an order ID.");

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      provider: "paypal",
      provider_reference: paypalOrder.id,
      amount: checkoutPrice,
      status: paypalOrder.status || "CREATED",
      webhook_payload: paypalOrder,
    });
    if (paymentError) throw paymentError;

    return Response.json({ id: paypalOrder.id });
  } catch (error) {
    console.error("Unable to create PayPal order:", error);
    await supabase.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "PayPal could not start this checkout. Please try again." }, { status: 502 });
  }
}
