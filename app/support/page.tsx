import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DOWNLOAD_LIMIT } from "@/lib/downloads";
import { getStoreLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreLocale()) === "vi" ? "Hướng dẫn" : "How it works" };
}

export default async function SupportPage() {
  const vi = (await getStoreLocale()) === "vi";
  const faqs = vi ? [
    ["Skill miễn phí hoạt động thế nào?", "Chọn Skill có nhãn Miễn phí, nhập đúng email và hệ thống sẽ gửi liên kết tải riêng tư. Không cần thẻ hay tài khoản thanh toán."],
    ["Tôi thanh toán tại Việt Nam bằng cách nào?", "Đơn trả phí tại Việt Nam dùng VietQR qua payOS. Hãy chuyển đúng số tiền và tuyệt đối không thay đổi nội dung chuyển khoản của đơn."],
    ["Khách quốc tế thanh toán bằng cách nào?", "Đơn quốc tế trả phí dùng PayPal. Tùy quốc gia và điều kiện tài khoản, khách có thể chọn số dư PayPal hoặc thẻ ghi nợ/tín dụng đủ điều kiện ngay trong cửa sổ thanh toán."],
    ["Video có phải kết quả thật không?", "Có. Video minh họa loại kết quả tạo ra bằng Skill tương ứng và chỉ tải khi bạn chủ động bấm Xem video để tiết kiệm dữ liệu."],
    ["Nếu nhập sai email thì sao?", "Hãy liên hệ hỗ trợ kèm mã hoặc nội dung chuyển khoản và biên nhận. Email chỉ được sửa sau khi giao dịch được xác minh."],
    ["Liên kết tải có hiệu lực bao lâu?", `Liên kết riêng tư có hiệu lực 7 ngày và tối đa ${DOWNLOAD_LIMIT} lượt tải. Hãy lưu file về thiết bị và không chia sẻ liên kết.`],
  ] : [
    ["How do free Skills work?", "Choose a Skill marked Free, enter a valid email address and we will send a private download link. No card or payment account is required."],
    ["How do I buy a premium Skill internationally?", "Enter your delivery email and continue to PayPal. Depending on country and eligibility, you can pay with PayPal or an eligible debit or credit card. The Skillroom server verifies the amount before delivery."],
    ["Can customers in Vietnam still pay?", "Yes. The Vietnamese storefront continues to use VietQR through payOS. Customers must transfer the exact amount without changing the payment reference."],
    ["Are the preview videos real outputs?", "Yes. Each video represents the type of result produced with that Skill and loads only after you click Watch video."],
    ["What if I enter the wrong email?", "Contact support with your order reference and payment receipt. Delivery is corrected only after the transaction has been verified."],
    ["How long does the download link last?", `The private link is valid for 7 days and up to ${DOWNLOAD_LIMIT} downloads. Save the file to your device and keep the link private.`],
  ];

  return (
    <><SiteHeader /><main>
      <section className="page-hero shell"><span className="section-index">{vi ? "HƯỚNG DẪN & HỖ TRỢ" : "HELP CENTER"}</span><h1>{vi ? "Từ xem video đến nhận Skill." : "From video preview to a Skill in your inbox."}</h1><p>{vi ? "Mọi bước quan trọng để chọn, thanh toán và nhận sản phẩm số an toàn." : "Everything you need to choose, receive and use a digital Skill with confidence."}</p></section>
      <section className="faq shell">{faqs.map(([title, answer], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{title}</h2><p>{answer}</p></div></article>)}</section>
    </main><SiteFooter /></>
  );
}
