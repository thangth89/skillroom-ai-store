# Thiết lập payOS cho Skillroom

## 1. Chuẩn bị trên payOS

1. Tạo hoặc đăng nhập tài khoản tại `https://my.payos.vn`.
2. Hoàn thành xác thực cá nhân/tổ chức và liên kết tài khoản ngân hàng.
3. Vào **Kênh thanh toán → Tạo kênh thanh toán**.
4. Chọn ngân hàng nhận tiền và hoàn tất tạo kênh.
5. Trong kênh vừa tạo, sao chép **Client ID**, **API Key** và **Checksum Key**.

Không gửi ba giá trị này qua chat và không commit vào GitHub.

## 2. Thêm biến môi trường Vercel

Trong **Vercel → skillroom-ai-store → Settings → Environments → Production**, thêm:

```dotenv
PAYOS_CLIENT_ID=
PAYOS_API_KEY=
PAYOS_CHECKSUM_KEY=
```

Bật **Sensitive** cho cả ba biến, lưu rồi redeploy Production.

## 3. Đăng ký webhook

Trong kênh thanh toán payOS, nhập Webhook URL:

```text
https://skillroom-ai-store.vercel.app/api/payments/payos/webhook
```

Nếu sau này dùng tên miền riêng, có thể thay bằng tên miền đó. Route webhook xác minh chữ ký bằng SDK payOS, đối chiếu `orderCode` và số tiền trong Supabase trước khi chuyển đơn sang `paid`.

## 4. Kiểm tra

1. Mở một Skill đang bán và nhập email ở checkout.
2. Website phải tạo mã đơn bắt đầu bằng `SK`, QR thật và nút mở trang payOS.
3. Đơn mới xuất hiện trong **Admin → Đơn hàng** với trạng thái chờ thanh toán.
4. Chỉ sau khi thanh toán thật và webhook hợp lệ, trạng thái mới chuyển sang đã thanh toán.

Không kiểm tra bằng cách tự sửa URL thành trang thành công; trang thành công luôn đọc lại trạng thái đã xác minh từ Supabase.
