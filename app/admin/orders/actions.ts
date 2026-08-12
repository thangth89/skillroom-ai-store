"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { revokeOrderDownloadLinks, sendOrderDeliveryEmail } from "@/lib/delivery";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

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

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  if (!host) throw new Error("Unable to determine the website address.");
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
    console.error("Unable to resend the order email:", error);
    status = "error";
  }

  revalidatePath("/admin/orders");
  revalidatePath(returnTo);
  redirect(deliveryDestination(returnTo, status));
}

export async function updateOrderEmailAndResend(formData: FormData) {
  await requireAdmin();
  const orderId = getText(formData, "order_id");
  const email = getText(formData, "customer_email").toLowerCase();
  const returnTo = getReturnTo(formData);

  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !validEmail(email)) {
    redirect(deliveryDestination(returnTo, "email_invalid"));
  }

  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle<{ id: string; status: string }>();

  if (orderError || !order) {
    redirect(deliveryDestination(returnTo, "email_update_error"));
  }
  if (order.status !== "paid") {
    redirect(deliveryDestination(returnTo, "not_paid"));
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ customer_email: email })
    .eq("id", order.id);
  if (updateError) {
    redirect(deliveryDestination(returnTo, "email_update_error"));
  }

  try {
    // Revoke first so an incorrect email address cannot keep using the old link.
    await revokeOrderDownloadLinks(order.id);
  } catch (error) {
    console.error("Unable to revoke download links while correcting the email:", error);
    redirect(deliveryDestination(returnTo, "security_error"));
  }

  let status = "corrected";
  try {
    const result = await sendOrderDeliveryEmail({
      orderId: order.id,
      origin: await requestOrigin(),
      force: true,
    });
    if (result.status === "not_configured") status = "email_saved_config";
  } catch (error) {
    console.error("The email was corrected, but delivery failed:", error);
    status = "email_saved_error";
  }

  revalidatePath("/admin/orders");
  revalidatePath(returnTo);
  redirect(deliveryDestination(returnTo, status));
}
