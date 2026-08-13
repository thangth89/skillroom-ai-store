import { hasEmailDeliveryConfig, sendOrderDeliveryEmail } from "@/lib/delivery";
import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";

type FreeSkill = {
  id: string;
  slug: string;
  name_en: string;
  version: string;
  file_path: string;
  is_free: boolean;
};

function validEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_INTERNATIONAL_SITE_URL?.replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

function missingInternationalSchema(error: { code?: string; message?: string } | null) {
  return error?.code === "42703" || error?.code === "PGRST204" || error?.message?.includes("is_free") === true;
}

export async function POST(request: Request) {
  if (!hasAdminDataConfig()) {
    return Response.json({ error: "Free Skill delivery is not configured yet." }, { status: 503 });
  }
  if (!hasEmailDeliveryConfig()) {
    return Response.json(
      { error: "Email delivery is not configured for this website environment yet." },
      { status: 503 },
    );
  }

  let body: { email?: unknown; slug?: unknown; marketingConsent?: unknown };
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
  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("id, slug, name_en, version, file_path, is_free")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_free", true)
    .not("file_path", "is", null)
    .maybeSingle<FreeSkill>();

  if (missingInternationalSchema(skillError)) {
    return Response.json({ error: "Free Skill delivery will be available after the international catalog is activated." }, { status: 503 });
  }
  if (skillError || !skill?.file_path) {
    return Response.json({ error: "This free Skill is not ready for delivery yet." }, { status: 404 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_email", email)
    .like("order_code", "FREE-%")
    .gte("created_at", oneHourAgo);

  if ((count ?? 0) >= 3) {
    return Response.json({ success: true });
  }

  const orderCode = `FREE-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
  const now = new Date().toISOString();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_code: orderCode,
      customer_email: email,
      status: "paid",
      currency: "USD",
      subtotal: 0,
      total: 0,
      paid_at: now,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    return Response.json({ error: "We could not prepare your free Skill." }, { status: 500 });
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    skill_id: skill.id,
    skill_name: skill.name_en,
    skill_slug: skill.slug,
    version: skill.version,
    file_path: skill.file_path,
    unit_price: 0,
    quantity: 1,
  });

  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "We could not prepare your free Skill." }, { status: 500 });
  }

  await supabase.from("payments").insert({
    order_id: order.id,
    provider: "free",
    amount: 0,
    status: "CLAIMED",
    webhook_payload: { marketing_consent: body.marketingConsent === true },
  });

  try {
    const result = await sendOrderDeliveryEmail({
      orderId: order.id,
      origin: siteOrigin(request),
      deliveryType: "free",
    });
    if (result.status === "not_configured") throw new Error("Email delivery is not configured.");
  } catch (error) {
    console.error("Free Skill delivery failed:", error);
    await supabase.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "We could not send the email. Please try again later." }, { status: 502 });
  }

  return Response.json({ success: true }, { status: 201 });
}
