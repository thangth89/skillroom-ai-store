import "server-only";

import type { StoreOrder } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

export type AdminOrderItem = {
  id: string;
  order_id: string;
  skill_id: string | null;
  skill_name: string;
  skill_slug: string;
  version: string;
  file_path: string | null;
  unit_price: number;
  quantity: number;
  created_at: string;
};

export type AdminPayment = {
  id: string;
  provider: string;
  provider_reference: string | null;
  amount: number;
  status: string;
  created_at: string;
};

export type AdminDownloadToken = {
  id: string;
  order_item_id: string;
  expires_at: string;
  used_at: string | null;
  download_count: number;
  created_at: string;
};

export async function getAdminOrderDetails(orderCode: string) {
  const supabase = createAdminClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("order_code", orderCode)
    .maybeSingle<StoreOrder>();

  if (orderError || !order) {
    return {
      order: null,
      items: [] as AdminOrderItem[],
      payments: [] as AdminPayment[],
      tokens: [] as AdminDownloadToken[],
      error: orderError,
    };
  }

  const [{ data: items, error: itemError }, { data: payments, error: paymentError }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select(
          "id, order_id, skill_id, skill_name, skill_slug, version, file_path, unit_price, quantity, created_at",
        )
        .eq("order_id", order.id)
        .order("created_at", { ascending: true })
        .returns<AdminOrderItem[]>(),
      supabase
        .from("payments")
        .select("id, provider, provider_reference, amount, status, created_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
        .returns<AdminPayment[]>(),
    ]);

  const itemRows = items ?? [];
  let tokens: AdminDownloadToken[] = [];
  let tokenError: { message: string } | null = null;

  if (itemRows.length > 0) {
    const tokenResult = await supabase
      .from("download_tokens")
      .select("id, order_item_id, expires_at, used_at, download_count, created_at")
      .in(
        "order_item_id",
        itemRows.map((item) => item.id),
      )
      .order("created_at", { ascending: false })
      .returns<AdminDownloadToken[]>();

    tokens = tokenResult.data ?? [];
    tokenError = tokenResult.error;
  }

  return {
    order,
    items: itemRows,
    payments: payments ?? [],
    tokens,
    error: itemError ?? paymentError ?? tokenError,
  };
}
