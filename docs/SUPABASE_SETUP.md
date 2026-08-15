# Thiết lập Supabase cho Skillroom

Phần đăng nhập quản trị đã có sẵn trong mã nguồn. Hãy hoàn thành các bước dưới đây để bật đăng nhập trên website thật.

## 1. Tạo dự án

1. Mở [database.new](https://database.new) và tạo một dự án Supabase.
2. Trong **Project Settings → API Keys**, sao chép **Project URL** và **Publishable key**.
3. Sao chép **Secret key** cho phần xử lý phía server. Không đưa khóa này vào biến bắt đầu bằng `NEXT_PUBLIC_`.

## 2. Tạo tài khoản admin

1. Vào **Authentication → Providers → Email** và bảo đảm đăng nhập bằng email được bật.
2. Vào **Authentication → Users → Add user**.
3. Tạo tài khoản bằng email và mật khẩu của bạn; đánh dấu email đã xác nhận nếu giao diện có tùy chọn này.
4. Website không có trang đăng ký admin công khai.

## 3. Tạo bảng dữ liệu

1. Mở **SQL Editor** trong Supabase.
2. Sao chép và chạy các file trong `supabase/migrations` theo thứ tự tên file. Với website đã có dữ liệu, chỉ cần chạy những migration mới chưa từng chạy.
3. Migration giảm giá hiện tại là `202608150001_skill_discounts.sql`; file này thêm phần trăm giảm riêng cho thị trường Việt Nam và quốc tế mà không thay đổi giá gốc.
4. Migration video hướng dẫn là `202608150002_skill_tutorial_video.sql`; trường này không bắt buộc và chỉ hiển thị trên trang chi tiết khi có URL.
5. Các migration bật Row Level Security và không cấp quyền đọc/ghi trực tiếp cho khách truy cập.

## 4. Thêm biến môi trường trên Vercel

Trong **Vercel → Project → Settings → Environment Variables**, thêm:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
ADMIN_EMAILS=your-admin-email@example.com
SKILL_STORAGE_BUCKET=skills-private
```

`ADMIN_EMAILS` có thể chứa nhiều email, ngăn cách bằng dấu phẩy. Email trong biến này phải trùng với tài khoản đã tạo ở bước 2.

`SUPABASE_SECRET_KEY` chỉ được dùng ở phía server và phải bắt đầu bằng `sb_secret_`. Không gửi khóa này qua chat và không commit vào GitHub.

Chọn cả **Production**, **Preview** và **Development** nếu bạn muốn đăng nhập hoạt động ở cả ba môi trường. Sau khi lưu, redeploy dự án để Vercel nhận biến mới.

## 5. Kiểm tra

1. Mở `https://ten-mien-cua-ban/admin/login`.
2. Đăng nhập bằng tài khoản admin đã tạo.
3. Thử mở cửa sổ ẩn danh và truy cập `/admin`; website phải chuyển về `/admin/login`.

Nếu chưa cấu hình đủ biến môi trường, trang đăng nhập sẽ hiển thị thông báo thiết lập và không thực hiện đăng nhập.
