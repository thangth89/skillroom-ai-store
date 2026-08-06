import { getStoreOrder } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderCode: string }> },
) {
  const { orderCode } = await params;
  const { order } = await getStoreOrder(orderCode);

  if (!order) {
    return Response.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  }

  return Response.json(
    { status: order.status, paidAt: order.paid_at },
    { headers: { "Cache-Control": "no-store" } },
  );
}
