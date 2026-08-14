import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getStoreLocale } from "@/lib/locale";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getStoreLocale()) === "vi" ? "Chính sách bảo mật" : "Privacy policy" };
}

export default async function PrivacyPage() {
  const vi = (await getStoreLocale()) === "vi";
  const sections = vi ? [
    ["Thông tin được lưu", "Chúng tôi lưu email nhận hàng, mã sản phẩm, trạng thái đơn và hoạt động tải giới hạn cần thiết để bàn giao Skill và hỗ trợ khách hàng."],
    ["Cách sử dụng email", "Email được dùng để gửi Skill và thông báo thiết yếu về đơn hàng hoặc hỗ trợ. Email tiếp thị là tùy chọn riêng và cần sự đồng ý của bạn."],
    ["Thông tin thanh toán", "Chi tiết thẻ và ví do trang thanh toán của nhà cung cấp xử lý. Skillroom không lưu toàn bộ số thẻ hoặc mã bảo mật."],
    ["Bảo mật file", "File Skill nằm trong kho riêng tư. Liên kết tải có thời hạn và giới hạn số lượt sử dụng."],
    ["Nhà cung cấp dịch vụ", "Chúng tôi chỉ sử dụng nhà cung cấp thanh toán, gửi email, lưu trữ website và file riêng tư trong phạm vi cần thiết để vận hành cửa hàng."],
  ] : [
    ["Information we collect", "We store the delivery email, product reference, order status and limited download activity needed to deliver Skills and provide customer support."],
    ["How we use email", "Your email is used to deliver the requested Skill and send essential order or support messages. Marketing email is optional and requires a separate choice."],
    ["Payment information", "Card and wallet details are handled by the hosted payment provider. Skillroom does not store full card numbers or security codes."],
    ["File security", "Skill files remain in private storage. Download links expire and have a limited number of uses."],
    ["Third parties", "We use service providers for payments, email delivery, hosting and private file storage only as needed to operate the store."],
  ];
  return <><SiteHeader /><main className="legal-page shell"><span className="section-index">{vi ? "PHÁP LÝ" : "LEGAL"}</span><h1>{vi ? "Chính sách bảo mật." : "Privacy policy."}</h1><section>{sections.map(([title, text]) => <div key={title}><h2>{title}</h2><p>{text}</p></div>)}</section></main><SiteFooter /></>;
}
