import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PrivacyPage() { return <><SiteHeader /><main className="legal-page shell"><span className="section-index">PHÁP LÝ</span><h1>Chính sách bảo mật.</h1><section><h2>Dữ liệu thu thập</h2><p>Website lưu email nhận hàng, thông tin đơn và trạng thái thanh toán để bàn giao sản phẩm và hỗ trợ khách hàng.</p><h2>Mục đích sử dụng</h2><p>Email được dùng để gửi Skill, thông báo liên quan đến đơn hàng và xử lý yêu cầu hỗ trợ. Không bán thông tin khách hàng cho bên thứ ba.</p><h2>Bảo vệ dữ liệu</h2><p>File Skill được lưu riêng tư; link tải có thời hạn. Thông tin bí mật của cổng thanh toán chỉ tồn tại ở phía máy chủ.</p></section></main><SiteFooter /></>; }
