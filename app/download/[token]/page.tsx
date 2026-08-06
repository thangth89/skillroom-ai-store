import Link from "next/link";
import { DOWNLOAD_LIMIT, getDownloadAccess } from "@/lib/downloads";

export const dynamic = "force-dynamic";

export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await getDownloadAccess(token);

  const message = {
    invalid: "Liên kết tải không hợp lệ hoặc không còn tồn tại.",
    expired: "Liên kết tải đã hết hạn. Hãy liên hệ hỗ trợ kèm mã đơn hàng.",
    exhausted: `Liên kết đã sử dụng đủ ${DOWNLOAD_LIMIT} lượt tải.`,
    unavailable: "File Skill hiện chưa khả dụng. Hãy liên hệ hỗ trợ để được kiểm tra.",
  } as const;

  if (access.status !== "ready") {
    return <main className="download-page"><section><div className="brand-mark large">S</div><span className="section-index">LIÊN KẾT TẢI BẢO MẬT</span><h1>Không thể tải file.</h1><p>{message[access.status]}</p><Link href="/support">Gặp vấn đề? Liên hệ hỗ trợ →</Link></section></main>;
  }

  const expiresAt = new Date(access.token.expires_at).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return <main className="download-page"><section><div className="brand-mark large">S</div><span className="section-index">LIÊN KẾT TẢI BẢO MẬT</span><h1>File Skill của bạn.</h1><p><strong>{access.item.skill_name}</strong> · Phiên bản {access.item.version}<br />Liên kết hết hạn ngày {expiresAt} và còn {access.remaining} lượt tải.</p><a className="primary-button inverse" href={`/api/downloads/${encodeURIComponent(token)}`}>Tải Skill</a><small>File được lấy trực tiếp từ kho riêng tư của Skillroom.</small><Link href="/support">Gặp vấn đề? Liên hệ hỗ trợ →</Link></section></main>;
}
