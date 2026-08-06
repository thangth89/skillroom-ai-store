import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Hướng dẫn" };

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero shell">
          <span className="section-index">TRUNG TÂM HỖ TRỢ</span>
          <h1>Hướng dẫn mua và sử dụng Skill.</h1>
          <p>Các bước quan trọng được giải thích rõ ràng để bạn xem, mua và nhận sản phẩm số an toàn.</p>
        </section>
        <section className="faq shell">
          <article><span>01</span><div><h2>Tôi nhận Skill bằng cách nào?</h2><p>Sau khi payOS xác nhận chuyển khoản, hệ thống gửi email chứa link tải bảo mật. Link có thời hạn và giới hạn số lượt tải.</p></div></article>
          <article><span>02</span><div><h2>Có được sửa nội dung chuyển khoản không?</h2><p>Không. Hãy giữ nguyên chính xác nội dung bắt đầu bằng SK đã điền sẵn trong QR. Không sửa, xóa hoặc thêm ký tự vì hệ thống dùng nội dung này để nhận diện đơn và gửi Skill tự động.</p></div></article>
          <article><span>03</span><div><h2>Video trên thẻ có phải kết quả thật?</h2><p>Đúng. Mỗi video đại diện cho đầu ra của Skill tương ứng. Video chỉ được tải sau khi bạn bấm xem để tiết kiệm dữ liệu.</p></div></article>
          <article><span>04</span><div><h2>Nếu nhập sai email thì sao?</h2><p>Hãy liên hệ hỗ trợ và cung cấp nội dung chuyển khoản, số tiền, thời gian giao dịch hoặc ảnh biên lai. Bạn không cần nhớ mã đơn; Skill chỉ được gửi lại sau khi thanh toán được đối chiếu chính xác.</p></div></article>
          <article><span>05</span><div><h2>Skill có được cập nhật không?</h2><p>Chính sách cập nhật được ghi riêng trên từng sản phẩm để bạn biết phiên bản nào nằm trong gói mua.</p></div></article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
