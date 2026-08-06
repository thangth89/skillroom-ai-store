import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Hướng dẫn" };

export default function SupportPage() {
  return <><SiteHeader /><main><section className="page-hero shell"><span className="section-index">HƯỚNG DẪN & HỖ TRỢ</span><h1>Từ xem video đến <em>cài Skill.</em></h1><p>Mọi bước quan trọng đều được tách rõ để bạn mua và sử dụng sản phẩm số an toàn.</p></section><section className="faq shell"><article><span>01</span><div><h2>Tôi nhận Skill bằng cách nào?</h2><p>Sau khi payOS xác nhận chuyển khoản, hệ thống gửi email chứa link tải bảo mật. Link có thời hạn và giới hạn số lượt tải.</p></div></article><article><span>02</span><div><h2>Video trên thẻ có phải kết quả thật?</h2><p>Đúng. Mỗi video đại diện cho đầu ra của Skill tương ứng. Bạn nên xem video và đọc yêu cầu ở trang chi tiết trước khi mua.</p></div></article><article><span>03</span><div><h2>Nếu nhập sai email thì sao?</h2><p>Liên hệ hỗ trợ kèm mã đơn và thông tin giao dịch. Đơn chỉ được gửi lại sau khi xác minh thanh toán.</p></div></article><article><span>04</span><div><h2>Skill có được cập nhật không?</h2><p>Chính sách cập nhật được ghi riêng trên từng sản phẩm để bạn biết phiên bản nào nằm trong gói mua.</p></div></article></section></main><SiteFooter /></>;
}
