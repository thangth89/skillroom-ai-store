import "server-only";

import { hashDownloadToken } from "@/lib/delivery";
import { createAdminClient } from "@/lib/supabase/admin";

export const DOWNLOAD_LIMIT = 5;

type TokenRow = {
  id: string;
  order_item_id: string;
  expires_at: string;
  download_count: number;
};

type DownloadItem = {
  id: string;
  order_id: string;
  skill_name: string;
  version: string;
  file_path: string | null;
};

export type DownloadAccess =
  | { status: "invalid" | "expired" | "exhausted" | "unavailable" }
  | {
      status: "ready";
      token: TokenRow;
      item: DownloadItem & { file_path: string };
      remaining: number;
    };

export async function getDownloadAccess(rawToken: string): Promise<DownloadAccess> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(rawToken)) return { status: "invalid" };

  const supabase = createAdminClient();
  const { data: token, error: tokenError } = await supabase
    .from("download_tokens")
    .select("id, order_item_id, expires_at, download_count")
    .eq("token_hash", hashDownloadToken(rawToken))
    .maybeSingle<TokenRow>();

  if (tokenError || !token) return { status: "invalid" };
  if (new Date(token.expires_at).getTime() <= Date.now()) return { status: "expired" };
  if (token.download_count >= DOWNLOAD_LIMIT) return { status: "exhausted" };

  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id, order_id, skill_name, version, file_path")
    .eq("id", token.order_item_id)
    .maybeSingle<DownloadItem>();

  if (itemError || !item?.file_path) return { status: "unavailable" };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", item.order_id)
    .maybeSingle<{ status: string }>();

  if (orderError || order?.status !== "paid") return { status: "unavailable" };

  return {
    status: "ready",
    token,
    item: { ...item, file_path: item.file_path },
    remaining: DOWNLOAD_LIMIT - token.download_count,
  };
}
