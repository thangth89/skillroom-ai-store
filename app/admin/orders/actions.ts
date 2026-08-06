"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendOrderDeliveryEmail } from "@/lib/delivery";
import { requireAdmin } from "@/lib/supabase/admin";

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getReturnTo(formData: FormData) {
  const value = getText(formData, "return_to");
  return /^\/admin\/orders\/[A-Za-z0-9-]+$/.test(value) ? value : "/admin/orders";
}

function deliveryDestination(path: string, status: string) {
  return `${path}?delivery=${encodeURIComponent(status)}`;
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Không xác định được địa chỉ website.");
  return `${protocol}://${host}`;
}

export async function resendOrderEmail(formData: FormData) {
  await requireAdmin();
  const orderId = getText(formData, "order_id");
  const returnTo = getReturnTo(formData);

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    redirect(deliveryDestination(returnTo, "invalid"));
  }

  let status = "sent";
  try {
    const result = await sendOrderDeliveryEmail({
      orderId,
      origin: await requestOrigin(),
      force: true,
    });
    if (result.status === "not_configured") status = "config";
  } catch (error) {
    console.error("Không thể gửi lại email đơn hàng:", error);
    status = "error";
  }

  revalidatePath("/admin/orders");
  revalidatePath(returnTo);
  redirect(deliveryDestination(returnTo, status));
}
