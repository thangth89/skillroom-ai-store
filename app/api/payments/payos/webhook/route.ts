export async function POST() {
  return Response.json({ message: "Webhook route đã được giữ chỗ. Cần kiểm tra chữ ký payOS trước khi kích hoạt." }, { status: 501 });
}
