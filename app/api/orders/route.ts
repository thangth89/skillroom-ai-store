export async function POST() {
  return Response.json({ message: "Order service chưa được kết nối Supabase/payOS." }, { status: 501 });
}
