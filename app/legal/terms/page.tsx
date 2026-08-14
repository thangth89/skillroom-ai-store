import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getStoreLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreLocale()) === "vi" ? "Điều khoản sử dụng" : "Terms of use" };
}

export default async function TermsPage() {
  const vi = (await getStoreLocale()) === "vi";
  const sections = vi ? [
    ["Quyền sử dụng", "Mỗi đơn hàng cấp cho người mua giấy phép cá nhân để sử dụng Skill trong phạm vi mô tả trên trang sản phẩm. Không được bán lại, đăng lại, chia sẻ công khai hoặc phân phối file Skill."],
    ["Sản phẩm số", "Khách hàng có trách nhiệm xem mô tả, yêu cầu công cụ, file đi kèm, giá theo thị trường và email nhận hàng trước khi hoàn tất thanh toán."],
    ["Skill miễn phí", "Skill miễn phí cần email hợp lệ nhưng không cần thanh toán. Các hạn chế về bán lại, phân phối và chia sẻ công khai vẫn được áp dụng."],
    ["Thanh toán và bàn giao", "Đơn trả phí chỉ được xác nhận khi nhà cung cấp thanh toán xác minh giao dịch. Skillroom sau đó gửi liên kết tải riêng tư, có thời hạn tới email của đơn."],
    ["Hoàn tiền", "Do Skill là sản phẩm số, điều kiện hoàn tiền phụ thuộc vào trạng thái bàn giao, lịch sử tải và lỗi kỹ thuật được xác minh. Hãy liên hệ hỗ trợ kèm mã đơn để được xem xét."],
  ] : [
    ["License to use", "Each order grants the buyer a personal license to use the Skill within the scope described on its product page. Skill files may not be resold, republished, shared publicly or redistributed."],
    ["Digital products", "Customers are responsible for reviewing the product description, tool requirements, included files, market-specific price and delivery email before checkout."],
    ["Free Skills", "Free Skills require a valid delivery email but no payment. The same restrictions on resale, redistribution and public sharing apply."],
    ["Payments and delivery", "A paid order is confirmed only after the payment provider verifies the transaction. Skillroom then sends a private, time-limited download link to the order email."],
    ["Refunds", "Because Skills are digital products, refund eligibility depends on delivery status, download activity and a verified technical fault. Contact support with your order reference for review."],
  ];
  return <><SiteHeader /><main className="legal-page shell"><span className="section-index">{vi ? "PHÁP LÝ" : "LEGAL"}</span><h1>{vi ? "Điều khoản sử dụng." : "Terms of use."}</h1><section>{sections.map(([title, text]) => <div key={title}><h2>{title}</h2><p>{text}</p></div>)}</section></main><SiteFooter /></>;
}
