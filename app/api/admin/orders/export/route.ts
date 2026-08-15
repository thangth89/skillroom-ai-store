import ExcelJS from "exceljs";
import { getAllAdminOrders, parseAdminOrderFilters, type AdminOrder } from "@/lib/admin-orders";
import { getOrderTransferContent, type OrderStatus } from "@/lib/orders";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;
const RELATED_ROWS_BATCH_SIZE = 100;

const statusLabel: Record<OrderStatus, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
  expired: "Hết hạn",
  refunded: "Đã hoàn tiền",
};

type ExportOrderItem = {
  order_id: string;
  skill_name: string;
  version: string;
  quantity: number;
};

type ExportPayment = {
  order_id: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  created_at: string;
};

function batches<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function vietnamExcelDate(value: string | null) {
  if (!value) return null;
  return new Date(new Date(value).getTime() + VIETNAM_OFFSET_MS);
}

function excelAmount(order: AdminOrder) {
  return order.currency.toUpperCase() === "VND" ? order.total : order.total / 100;
}

function providerLabel(provider: string) {
  const normalized = provider.trim().toLowerCase();
  if (normalized === "payos") return "payOS";
  if (normalized === "paypal") return "PayPal";
  if (normalized === "free") return "Miễn phí";
  if (normalized === "lemonsqueezy") return "Lemon Squeezy";
  return provider || "—";
}

function dateLabel(value: string) {
  if (!value) return "không giới hạn";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

async function getRelatedRows(orderIds: string[]) {
  const supabase = createAdminClient();
  const items: ExportOrderItem[] = [];
  const payments: ExportPayment[] = [];

  for (const orderIdBatch of batches(orderIds, RELATED_ROWS_BATCH_SIZE)) {
    const [itemResult, paymentResult] = await Promise.all([
      supabase
        .from("order_items")
        .select("order_id, skill_name, version, quantity")
        .in("order_id", orderIdBatch)
        .order("created_at", { ascending: true })
        .returns<ExportOrderItem[]>(),
      supabase
        .from("payments")
        .select("order_id, provider, provider_reference, status, created_at")
        .in("order_id", orderIdBatch)
        .order("created_at", { ascending: false })
        .returns<ExportPayment[]>(),
    ]);

    if (itemResult.error || paymentResult.error) {
      return {
        items,
        payments,
        error: itemResult.error ?? paymentResult.error,
      };
    }

    items.push(...(itemResult.data ?? []));
    payments.push(...(paymentResult.data ?? []));
  }

  return { items, payments, error: null };
}

function buildWorkbook(input: {
  orders: AdminOrder[];
  items: ExportOrderItem[];
  payments: ExportPayment[];
  searchTerm: string;
  fromDate: string;
  toDate: string;
  truncated: boolean;
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Skillroom";
  workbook.company = "Skillroom";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Đơn hàng", {
    views: [{ state: "frozen", ySplit: 5 }],
    properties: { defaultRowHeight: 20 },
  });

  worksheet.columns = [
    { key: "orderCode", width: 25 },
    { key: "createdAt", width: 20 },
    { key: "email", width: 32 },
    { key: "market", width: 14 },
    { key: "orderType", width: 14 },
    { key: "skills", width: 38 },
    { key: "versions", width: 15 },
    { key: "quantity", width: 12 },
    { key: "provider", width: 17 },
    { key: "reference", width: 26 },
    { key: "transferContent", width: 24 },
    { key: "amount", width: 16 },
    { key: "currency", width: 11 },
    { key: "status", width: 18 },
    { key: "paidAt", width: 20 },
  ];

  worksheet.mergeCells("A1:O1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "SKILLROOM — BÁO CÁO ĐƠN HÀNG";
  titleCell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF123E2B" } };
  worksheet.getRow(1).height = 34;

  worksheet.mergeCells("A2:O2");
  const filterParts = [
    `Từ ${dateLabel(input.fromDate)} đến ${dateLabel(input.toDate)}`,
    input.searchTerm ? `Tìm kiếm: ${input.searchTerm}` : "Tất cả đơn hàng",
  ];
  worksheet.getCell("A2").value = filterParts.join("  •  ");
  worksheet.getCell("A2").font = { color: { argb: "FF526047" }, size: 10 };
  worksheet.getCell("A2").alignment = { vertical: "middle" };
  worksheet.getRow(2).height = 25;

  const vndTotal = input.orders
    .filter((order) => order.currency.toUpperCase() === "VND")
    .reduce((total, order) => total + order.total, 0);
  const usdTotal = input.orders
    .filter((order) => order.currency.toUpperCase() === "USD")
    .reduce((total, order) => total + order.total / 100, 0);
  worksheet.mergeCells("A3:O3");
  worksheet.getCell("A3").value = [
    `${input.orders.length} đơn hàng`,
    `Tổng VND: ${new Intl.NumberFormat("vi-VN").format(vndTotal)} ₫`,
    `Tổng USD: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usdTotal)}`,
    input.truncated ? "Đã giới hạn ở 10.000 đơn gần nhất" : "",
  ].filter(Boolean).join("  •  ");
  worksheet.getCell("A3").font = { bold: true, color: { argb: "FF183C2B" }, size: 10 };
  worksheet.getCell("A3").alignment = { vertical: "middle" };
  worksheet.getRow(3).height = 25;

  const headers = [
    "Mã đơn",
    "Ngày tạo",
    "Email",
    "Thị trường",
    "Loại đơn",
    "Skill",
    "Phiên bản",
    "Số lượng",
    "Thanh toán",
    "Mã giao dịch",
    "Nội dung chuyển khoản",
    "Tổng tiền",
    "Tiền tệ",
    "Trạng thái",
    "Ngày thanh toán",
  ];
  const headerRow = worksheet.getRow(5);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174D35" } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FF9EEA5A" } } };
  });
  headerRow.height = 29;
  worksheet.autoFilter = { from: "A5", to: "O5" };

  const itemsByOrder = new Map<string, ExportOrderItem[]>();
  input.items.forEach((item) => {
    const orderItems = itemsByOrder.get(item.order_id) ?? [];
    orderItems.push(item);
    itemsByOrder.set(item.order_id, orderItems);
  });

  const latestPaymentByOrder = new Map<string, ExportPayment>();
  input.payments.forEach((payment) => {
    if (!latestPaymentByOrder.has(payment.order_id)) {
      latestPaymentByOrder.set(payment.order_id, payment);
    }
  });

  input.orders.forEach((order, index) => {
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const payment = latestPaymentByOrder.get(order.id);
    const row = worksheet.addRow({
      orderCode: order.order_code,
      createdAt: vietnamExcelDate(order.created_at),
      email: order.customer_email,
      market: order.currency.toUpperCase() === "VND" ? "Việt Nam" : "Quốc tế",
      orderType: order.total === 0 ? "Miễn phí" : "Trả phí",
      skills: orderItems.map((item) => item.skill_name).join("\n") || "—",
      versions: [...new Set(orderItems.map((item) => item.version))].join(", ") || "—",
      quantity: orderItems.reduce((total, item) => total + item.quantity, 0),
      provider: payment ? providerLabel(payment.provider) : "—",
      reference: payment?.provider_reference ?? (order.payos_order_code ? String(order.payos_order_code) : "—"),
      transferContent: getOrderTransferContent(order) || "—",
      amount: excelAmount(order),
      currency: order.currency.toUpperCase(),
      status: statusLabel[order.status],
      paidAt: vietnamExcelDate(order.paid_at),
    });

    row.height = Math.max(23, orderItems.length * 17);
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: "FFD8DED8" } } };
      if (index % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F7F2" } };
      }
    });
    row.getCell("createdAt").numFmt = "dd/mm/yyyy hh:mm";
    row.getCell("paidAt").numFmt = "dd/mm/yyyy hh:mm";
    row.getCell("quantity").numFmt = "0";
    row.getCell("amount").numFmt = order.currency.toUpperCase() === "VND" ? "#,##0" : "$#,##0.00";
  });

  worksheet.getColumn("email").alignment = { vertical: "top", wrapText: true };
  worksheet.getColumn("amount").alignment = { vertical: "top", horizontal: "right" };
  worksheet.getColumn("quantity").alignment = { vertical: "top", horizontal: "center" };

  return workbook;
}

export async function GET(request: Request) {
  await requireAdmin();

  const url = new URL(request.url);
  const filters = parseAdminOrderFilters({
    q: url.searchParams.get("q") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });

  if (filters.error) {
    return Response.json({ error: filters.error }, { status: 400 });
  }

  const orderResult = await getAllAdminOrders(filters);
  if (orderResult.error) {
    return Response.json({ error: `Không thể tải đơn hàng: ${orderResult.error.message}` }, { status: 500 });
  }

  const relatedResult = await getRelatedRows(orderResult.orders.map((order) => order.id));
  if (relatedResult.error) {
    return Response.json({ error: `Không thể tải chi tiết đơn hàng: ${relatedResult.error.message}` }, { status: 500 });
  }

  const workbook = buildWorkbook({
    orders: orderResult.orders,
    items: relatedResult.items,
    payments: relatedResult.payments,
    searchTerm: filters.searchTerm,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    truncated: orderResult.truncated,
  });
  const workbookBuffer = await workbook.xlsx.writeBuffer();
  const body = Buffer.from(workbookBuffer);
  const fileDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

  return new Response(body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="skillroom-orders-${fileDate}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
