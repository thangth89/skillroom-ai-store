import "server-only";

import type { OrderStatus } from "@/lib/orders";
import { createAdminClient } from "@/lib/supabase/admin";

const ORDER_COLUMNS =
  "id, order_code, customer_email, status, total, currency, payos_order_code, transfer_content, paid_at, created_at";
const VIETNAM_TIMEZONE_OFFSET = "+07:00";
const EXPORT_PAGE_SIZE = 500;

export type AdminOrder = {
  id: string;
  order_code: string;
  customer_email: string;
  status: OrderStatus;
  total: number;
  currency: string;
  payos_order_code: number | null;
  transfer_content: string | null;
  paid_at: string | null;
  created_at: string;
};

export type AdminOrderFilters = {
  searchTerm: string;
  fromDate: string;
  toDate: string;
  fromIso: string | null;
  toExclusiveIso: string | null;
  error: string | null;
};

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function startOfVietnamDate(value: string) {
  return new Date(`${value}T00:00:00${VIETNAM_TIMEZONE_OFFSET}`);
}

export function parseAdminOrderFilters(input: {
  q?: string;
  from?: string;
  to?: string;
}): AdminOrderFilters {
  const searchTerm = input.q?.trim().slice(0, 120) ?? "";
  const rawFrom = input.from?.trim() ?? "";
  const rawTo = input.to?.trim() ?? "";

  if ((rawFrom && !isCalendarDate(rawFrom)) || (rawTo && !isCalendarDate(rawTo))) {
    return {
      searchTerm,
      fromDate: rawFrom,
      toDate: rawTo,
      fromIso: null,
      toExclusiveIso: null,
      error: "Ngày lọc không hợp lệ. Hãy chọn lại ngày bắt đầu và ngày kết thúc.",
    };
  }

  if (rawFrom && rawTo && rawFrom > rawTo) {
    return {
      searchTerm,
      fromDate: rawFrom,
      toDate: rawTo,
      fromIso: null,
      toExclusiveIso: null,
      error: "Ngày bắt đầu phải sớm hơn hoặc trùng ngày kết thúc.",
    };
  }

  const fromDate = rawFrom;
  const toDate = rawTo;
  const fromIso = fromDate ? startOfVietnamDate(fromDate).toISOString() : null;
  let toExclusiveIso: string | null = null;
  if (toDate) {
    const nextDay = startOfVietnamDate(toDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    toExclusiveIso = nextDay.toISOString();
  }

  return {
    searchTerm,
    fromDate,
    toDate,
    fromIso,
    toExclusiveIso,
    error: null,
  };
}

function isWithinDateRange(order: AdminOrder, filters: AdminOrderFilters) {
  const createdAt = new Date(order.created_at).getTime();
  if (filters.fromIso && createdAt < new Date(filters.fromIso).getTime()) return false;
  if (filters.toExclusiveIso && createdAt >= new Date(filters.toExclusiveIso).getTime()) return false;
  return true;
}

export async function getAdminOrders(filters: AdminOrderFilters, limit = 100) {
  if (filters.error) {
    return { orders: [] as AdminOrder[], error: null };
  }

  const supabase = createAdminClient();
  if (filters.searchTerm.length >= 2) {
    const result = await supabase.rpc("search_admin_orders", {
      search_term: filters.searchTerm,
    });
    const rows = Array.isArray(result.data) ? (result.data as AdminOrder[]) : [];
    return {
      orders: rows.filter((order) => isWithinDateRange(order, filters)).slice(0, limit),
      error: result.error,
    };
  }

  let request = supabase.from("orders").select(ORDER_COLUMNS);
  if (filters.fromIso) request = request.gte("created_at", filters.fromIso);
  if (filters.toExclusiveIso) request = request.lt("created_at", filters.toExclusiveIso);

  const result = await request
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<AdminOrder[]>();

  return { orders: result.data ?? [], error: result.error };
}

export async function getAllAdminOrders(filters: AdminOrderFilters, maxRows = 10_000) {
  if (filters.error) {
    return { orders: [] as AdminOrder[], error: null, truncated: false };
  }

  if (filters.searchTerm.length >= 2) {
    const result = await getAdminOrders(filters, maxRows);
    return { ...result, truncated: false };
  }

  const supabase = createAdminClient();
  const orders: AdminOrder[] = [];
  let offset = 0;

  while (orders.length < maxRows) {
    const pageSize = Math.min(EXPORT_PAGE_SIZE, maxRows - orders.length);
    let request = supabase.from("orders").select(ORDER_COLUMNS);
    if (filters.fromIso) request = request.gte("created_at", filters.fromIso);
    if (filters.toExclusiveIso) request = request.lt("created_at", filters.toExclusiveIso);

    const result = await request
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1)
      .returns<AdminOrder[]>();

    if (result.error) {
      return { orders, error: result.error, truncated: false };
    }

    const page = result.data ?? [];
    orders.push(...page);
    if (page.length < pageSize) {
      return { orders, error: null, truncated: false };
    }
    offset += page.length;
  }

  return { orders, error: null, truncated: true };
}

export function adminOrderFilterParams(filters: AdminOrderFilters) {
  const params = new URLSearchParams();
  if (filters.searchTerm) params.set("q", filters.searchTerm);
  if (filters.fromDate) params.set("from", filters.fromDate);
  if (filters.toDate) params.set("to", filters.toDate);
  return params;
}
