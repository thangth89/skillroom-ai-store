import "server-only";

import { createAdminClient, hasAdminDataConfig } from "@/lib/supabase/admin";

export type OrderStatus = "pending" | "paid" | "cancelled" | "expired" | "refunded";

export type StoreOrder = {
  id: string;
  order_code: string;
  customer_email: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  total: number;
  payos_order_code: number | null;
  payos_payment_link_id: string | null;
  checkout_url: string | null;
  qr_code_data: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StoreOrderItem = {
  id: string;
  skill_name: string;
  skill_slug: string;
  version: string;
  unit_price: number;
  quantity: number;
};

export async function getStoreOrder(orderCode: string) {
  if (!hasAdminDataConfig()) {
    return { order: null, item: null, error: new Error("Thiếu cấu hình Supabase") };
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_code", orderCode)
    .maybeSingle<StoreOrder>();

  if (error || !order) return { order: null, item: null, error };

  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id, skill_name, skill_slug, version, unit_price, quantity")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<StoreOrderItem>();

  return { order, item, error: itemError };
}
