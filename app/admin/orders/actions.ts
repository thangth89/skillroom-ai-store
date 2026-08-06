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

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    redirect("/admin/orders?delivery=invalid");
  }

  let destination = "/admin/orders?delivery=sent";
  try {
    const result = await sendOrderDeliveryEmail({
      orderId,
      origin: await requestOrigin(),
      force: true,
    });
    if (result.status === "not_configured") destination = "/admin/orders?delivery=config";
  } catch (error) {
    console.error("Không thể gửi lại email đơn hàng:", error);
    destination = "/admin/orders?delivery=error";
  }

  revalidatePath("/admin/orders");
  redirect(destination);
}
