# Skillroom — bản Next.js dành cho Vercel

Đây là bản mã nguồn độc lập để chạy bằng Next.js và triển khai lên Vercel. Bản này không chứa cấu hình hosting nội bộ và không chứa khóa bí mật.

## Chạy thử trên máy

Yêu cầu Node.js 20.9 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## Đưa lên Vercel

### Cách dễ nhất: GitHub

1. Giải nén thư mục này.
2. Tạo repository GitHub và tải toàn bộ nội dung trong thư mục lên.
3. Vào Vercel, chọn **Add New → Project**.
4. Chọn repository vừa tạo.
5. Framework Preset để **Next.js**.
6. Root Directory để trống nếu repository chỉ chứa website này.
7. Bấm **Deploy**.

### Dùng Vercel CLI

```bash
npm install
npx vercel
```

## Biến môi trường

Sao chép `.env.example` thành `.env.local` khi phát triển. Trên Vercel, nhập các biến tại **Project Settings → Environment Variables**.

Không đưa khóa `SUPABASE_SERVICE_ROLE_KEY`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` hoặc `RESEND_API_KEY` vào biến bắt đầu bằng `NEXT_PUBLIC_`.

## Trạng thái chức năng

- Hoàn chỉnh: giao diện, lưới 3×3, phân trang, video preview, trang chi tiết, checkout, trang QR mẫu, thành công, tải file mẫu và quản trị.
- Chưa kết nối thật: Supabase, payOS, Resend và kho file riêng tư.
- Các API chưa kết nối cố ý trả mã `501` để không tạo đơn giả.

## Thư mục chính

- `app/`: toàn bộ page và API route.
- `components/`: thành phần giao diện dùng lại.
- `lib/`: kiểu dữ liệu, dữ liệu Skill và hàm định dạng.
- `public/demo/`: video mô phỏng; thay bằng video YouTube Unlisted hoặc Cloudflare Stream khi vận hành.
- `docs/ARCHITECTURE.md`: sơ đồ chức năng và lộ trình backend.
