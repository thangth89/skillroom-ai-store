# Skillroom — cấu trúc website

## Nhóm trang công khai

- `/`: Trang cửa hàng, hero và 6 Skill đầu tiên theo thứ tự Admin.
- `/skills`: Kho Skill, phân trang 6 sản phẩm theo lưới 3×2 trên desktop.
- `/skills/[slug]`: Video lớn, mô tả, nội dung bàn giao, yêu cầu và nút mua.
- `/support`: Hướng dẫn mua và sử dụng.
- `/legal/terms`, `/legal/privacy`: Điều khoản và quyền riêng tư.

## Nhóm mua hàng

- `/checkout/[slug]`: Thu email, xác nhận điều khoản và tóm tắt đơn.
- `/payment/[orderCode]`: Vị trí QR payOS, trạng thái chờ webhook.
- `/payment/success`: Xác nhận đơn và hướng dẫn kiểm tra email.
- `/download/[token]`: Kiểm tra link tải có hạn trước khi trả file.

## Nhóm quản trị

- `/admin`: Chỉ số và trạng thái các tích hợp.
- `/admin/skills`: Thêm, sửa, ẩn và xem Skill.
- `/admin/orders`: Theo dõi đơn, tìm theo nội dung chuyển khoản/mã/email và mở chi tiết để xử lý hỗ trợ.
- `/admin/settings`: Cấu hình payOS, Resend và Supabase.

Khi đưa vào vận hành, toàn bộ `/admin/*` phải yêu cầu đăng nhập.

## API

- `POST /api/orders`: Xác thực email, tạo đơn ở Supabase, gọi payOS và trả dữ liệu QR.
- `POST /api/payments/payos/webhook`: Xác minh chữ ký, đối chiếu mã đơn/số tiền, đánh dấu `PAID` và lên lịch gửi email.
- `GET /api/health`: Kiểm tra dịch vụ.

Các route thanh toán hiện là điểm nối an toàn, cố ý trả `501` cho tới khi có khóa thật.

## Tổ chức mã nguồn

- `app/`: Route và bố cục từng trang.
- `components/`: Thành phần giao diện dùng lại.
- `lib/skills.ts`: Dữ liệu demo dự phòng khi chưa có Skill thật nào được xuất bản.
- `lib/catalog.ts`: Chỉ đọc Skill `published` có đủ video và file để hiển thị ngoài cửa hàng.
- `lib/supabase/skill-records.ts`: Đọc dữ liệu Skill thật cho khu vực quản trị.
- `lib/types.ts`: Kiểu dữ liệu dùng chung.
- `public/demo/`: Video demo cục bộ; khi chạy thật thay URL Cloudflare Stream/YouTube.

## Nguồn video thành phẩm

- File video trực tiếp qua URL HTTPS, gồm MP4 và các định dạng trình duyệt hỗ trợ.
- YouTube: link `watch`, `youtu.be`, `shorts`, `live` hoặc `embed`.
- Facebook: link video, Watch hoặc Reel công khai cho phép nhúng.
- Instagram: link Post, Reel hoặc TV công khai; Instagram có thể yêu cầu người xem chạm phát.

Trình phát chỉ tải và phát video sau khi người xem chủ động bấm nút xem, giúp giảm băng thông. Instagram dùng trình phát nhúng của nền tảng.

## Luồng đơn hàng

`PENDING` → `PAID` → `DELIVERY_QUEUED` → `DELIVERED`

Trạng thái lỗi: `EXPIRED`, `PAYMENT_MISMATCH`, `DELIVERY_FAILED`, `REFUNDED`.

`POST /api/orders` chỉ nhận slug Skill và email, sau đó đọc lại giá/file từ Supabase, tạo snapshot `order_items` và gọi SDK payOS. Trang thành công không tin dữ liệu Return URL; chỉ hiển thị xác nhận khi bảng `orders` đã được webhook có chữ ký hợp lệ chuyển sang `paid` và số tiền khớp chính xác.

Mỗi đơn lưu riêng nội dung chuyển khoản `SK...` đã gửi sang payOS. Khách phải giữ nguyên nội dung này. Admin có thể dùng nội dung trên sao kê để tìm lại đơn khi khách nhập sai email; thao tác sửa email sẽ thu hồi toàn bộ link tải cũ trước khi cấp link mới và gửi lại qua Resend.

## Trạng thái quản lý Skill

- `draft`: Lưu nháp, chưa bán.
- `published`: Đang bán; bắt buộc đã có file trong bucket riêng tư.
- `archived`: Đã ẩn nhưng không xóa để giữ lịch sử đơn hàng.

Trang quản trị hỗ trợ thêm, sửa, đổi trạng thái, thay file và sắp xếp thứ tự Skill. Khi chưa có sản phẩm thật hợp lệ, cửa hàng dùng dữ liệu demo. Ngay khi có ít nhất một Skill `published` đủ video và file, trang chủ, kho 3×2, trang chi tiết và checkout tự chuyển sang dữ liệu Supabase.
