import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";
import { getPayOSClient, hasPayOSConfig } from "@/lib/payos";

type PurchasableSkill = {
  id: string;
  slug: string;
  name: string;
  price: number;
  version: string;
  file_path: string;
};

function validEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

function createPayOSOrderCode() {
  return Date.now() * 100 + Math.floor(Math.random() * 100);
}

function siteOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return configured || new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!hasAdminDataConfig()) {
    return Response.json({ error: "Cửa hàng chưa kết nối cơ sở dữ liệu." }, { status: 503 });
  }

  if (!hasPayOSConfig()) {
    return Response.json({ error: "Thanh toán payOS chưa được kích hoạt." }, { status: 503 });
  }

  let body: { email?: unknown; slug?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; slug?: unknown };
  } catch {
    return Response.json({ error: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : body.email;
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";

  if (!validEmail(email)) {
    return Response.json({ error: "Địa chỉ email không hợp lệ." }, { status: 400 });
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return Response.json({ error: "Sản phẩm không hợp lệ." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: skill, error: skillError } = await supabase
    .from("skills")
    .select("id, slug, name, price, version, file_path")
    .eq("slug", slug)
    .eq("status", "published")
    .not("file_path", "is", null)
    .not("video_url", "is", null)
    .maybeSingle<PurchasableSkill>();

  if (skillError || !skill) {
    return Response.json({ error: "Skill này chưa sẵn sàng để thanh toán." }, { status: 404 });
  }

  let order: { id: string; order_code: string; payos_order_code: number } | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt += 1) {
    const payosOrderCode = createPayOSOrderCode();
    const orderCode = `SK-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const { data, error } = await supabase
      .from("orders")
      .insert({
        order_code: orderCode,
        customer_email: email,
        status: "pending",
        currency: "VND",
        subtotal: skill.price,
        total: skill.price,
        payos_order_code: payosOrderCode,
      })
      .select("id, order_code, payos_order_code")
      .single<{ id: string; order_code: string; payos_order_code: number }>();

    if (!error && data) order = data;
    else if (error?.code !== "23505") {
      return Response.json({ error: "Không thể tạo đơn hàng." }, { status: 500 });
    }
  }

  if (!order) {
    return Response.json({ error: "Không thể cấp mã đơn hàng. Vui lòng thử lại." }, { status: 500 });
  }

  const { error: itemError } = await supabase.from("order_items").insert({
    order_id: order.id,
    skill_id: skill.id,
    skill_name: skill.name,
    skill_slug: skill.slug,
    version: skill.version,
    file_path: skill.file_path,
    unit_price: skill.price,
    quantity: 1,
  });

  if (itemError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return Response.json({ error: "Không thể lưu sản phẩm vào đơn hàng." }, { status: 500 });
  }

  const origin = siteOrigin(request);
  const returnUrl = `${origin}/payment/${order.order_code}?returned=1`;
  const cancelUrl = `${origin}/payment/${order.order_code}?cancelled=1`;
  const expiredAt = Math.floor(Date.now() / 1000) + 15 * 60;

  try {
    const paymentLink = await getPayOSClient().paymentRequests.create({
      orderCode: order.payos_order_code,
      amount: skill.price,
      description: `SK${String(order.payos_order_code).slice(-12)}`,
      buyerEmail: email,
      items: [{ name: skill.name.slice(0, 100), quantity: 1, price: skill.price }],
      cancelUrl,
      returnUrl,
      expiredAt,
    });

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payos_payment_link_id: paymentLink.paymentLinkId,
        checkout_url: paymentLink.checkoutUrl,
        qr_code_data: paymentLink.qrCode,
      })
      .eq("id", order.id);

    if (updateError) throw new Error("Không thể lưu thông tin thanh toán.");

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "payos",
      provider_reference: paymentLink.paymentLinkId,
      amount: skill.price,
      status: "PENDING",
    });

    return Response.json(
      {
        orderCode: order.order_code,
        checkoutUrl: paymentLink.checkoutUrl,
        expiresAt: paymentLink.expiredAt ?? expiredAt,
      },
      { status: 201 },
    );
  } catch {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
    return Response.json(
      { error: "payOS chưa thể tạo mã thanh toán. Vui lòng thử lại sau." },
      { status: 502 },
    );
  }
}
