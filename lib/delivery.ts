import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const DOWNLOAD_VALID_DAYS = 7;

type DeliveryOrder = {
  id: string;
  order_code: string;
  customer_email: string;
  status: string;
};

type DeliveryItem = {
  id: string;
  skill_name: string;
  version: string;
  file_path: string | null;
};

export type DeliveryResult =
  | { status: "sent"; emailId: string }
  | { status: "not_configured" };

export function hasEmailDeliveryConfig() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function hashDownloadToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailSubject(skillName: string) {
  return `Skillroom - Link tải ${skillName}`.replace(/[\r\n]+/g, " ");
}

function emailHtml(input: {
  orderCode: string;
  skillName: string;
  version: string;
  downloadUrl: string;
}) {
  const orderCode = escapeHtml(input.orderCode);
  const skillName = escapeHtml(input.skillName);
  const version = escapeHtml(input.version);
  const downloadUrl = escapeHtml(input.downloadUrl);

  return `<!doctype html>
<html lang="vi">
  <body style="margin:0;background:#f2f0e8;color:#11140f;font-family:Arial,sans-serif">
    <div style="max-width:620px;margin:0 auto;padding:40px 20px">
      <div style="background:#11140f;color:#fff;border-radius:24px;padding:36px">
        <div style="color:#b8ff6a;font-size:13px;font-weight:700;letter-spacing:.12em">SKILLROOM</div>
        <h1 style="margin:18px 0 12px;font-size:32px;line-height:1.15">Skill của bạn đã sẵn sàng.</h1>
        <p style="margin:0;color:#c8ccc4;line-height:1.7">Thanh toán cho đơn <strong style="color:#fff">${orderCode}</strong> đã được xác nhận.</p>
        <div style="margin:28px 0;padding:20px;border:1px solid #343a31;border-radius:16px">
          <div style="font-size:20px;font-weight:700">${skillName}</div>
          <div style="margin-top:6px;color:#9ca298;font-size:13px">Phiên bản ${version}</div>
        </div>
        <a href="${downloadUrl}" style="display:inline-block;background:#b8ff6a;color:#11140f;padding:15px 22px;border-radius:999px;text-decoration:none;font-weight:700">Tải Skill</a>
        <p style="margin:24px 0 0;color:#9ca298;font-size:13px;line-height:1.7">Liên kết có hiệu lực 7 ngày và tối đa 5 lượt tải. Không chia sẻ liên kết này cho người khác.</p>
      </div>
      <p style="margin:18px 8px 0;color:#747970;font-size:12px;line-height:1.6">Nếu nút không hoạt động, hãy sao chép đường dẫn sau vào trình duyệt:<br><a href="${downloadUrl}" style="color:#384532;word-break:break-all">${downloadUrl}</a></p>
    </div>
  </body>
</html>`;
}

function emailText(input: {
  orderCode: string;
  skillName: string;
  version: string;
  downloadUrl: string;
}) {
  return [
    "Skillroom - Skill của bạn đã sẵn sàng.",
    "",
    `Đơn hàng: ${input.orderCode}`,
    `Sản phẩm: ${input.skillName}`,
    `Phiên bản: ${input.version}`,
    "",
    `Tải Skill: ${input.downloadUrl}`,
    "",
    "Liên kết có hiệu lực 7 ngày và tối đa 5 lượt tải. Không chia sẻ liên kết này cho người khác.",
  ].join("\n");
}

export async function sendOrderDeliveryEmail(input: {
  orderId: string;
  origin: string;
  force?: boolean;
}): Promise<DeliveryResult> {
  if (!hasEmailDeliveryConfig()) return { status: "not_configured" };

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_code, customer_email, status")
    .eq("id", input.orderId)
    .maybeSingle<DeliveryOrder>();

  if (orderError || !order) throw new Error("Không tìm thấy đơn hàng để gửi email.");
  if (order.status !== "paid") throw new Error("Đơn hàng chưa được xác nhận thanh toán.");

  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id, skill_name, version, file_path")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<DeliveryItem>();

  if (itemError || !item?.file_path) throw new Error("Đơn hàng chưa có file Skill để bàn giao.");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DOWNLOAD_VALID_DAYS * 24 * 60 * 60 * 1000);
  const { error: tokenError } = await supabase.from("download_tokens").insert({
    order_item_id: item.id,
    token_hash: hashDownloadToken(token),
    expires_at: expiresAt.toISOString(),
  });

  if (tokenError) throw new Error("Không thể tạo liên kết tải Skill.");

  const parsedOrigin = new URL(input.origin);
  if (!/^https?:$/.test(parsedOrigin.protocol)) throw new Error("Địa chỉ website không hợp lệ.");
  const downloadUrl = new URL(`/download/${token}`, parsedOrigin.origin).toString();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const payload = {
    from: process.env.EMAIL_FROM!,
    to: order.customer_email,
    subject: emailSubject(item.skill_name),
    html: emailHtml({
      orderCode: order.order_code,
      skillName: item.skill_name,
      version: item.version,
      downloadUrl,
    }),
    text: emailText({
      orderCode: order.order_code,
      skillName: item.skill_name,
      version: item.version,
      downloadUrl,
    }),
    ...(replyTo ? { replyTo } : {}),
    tags: [{ name: "order", value: order.order_code }],
  };
  const idempotencyKey = input.force
    ? `skillroom-resend-${order.id}-${randomUUID()}`
    : `skillroom-order-${order.id}`;
  const { data, error } = await resend.emails.send(payload, { idempotencyKey });

  if (error || !data?.id) {
    throw new Error(error?.message || "Resend chưa thể gửi email.");
  }

  return { status: "sent", emailId: data.id };
}
