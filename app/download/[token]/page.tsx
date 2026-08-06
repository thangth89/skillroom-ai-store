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
    return <main className="download-page"><section className="download-card"><div className="brand-mark large">S</div><span className="section-index download-kicker">LIÊN KẾT TẢI BẢO MẬT</span><h1>Không thể tải file.</h1><p className="download-meta">{message[access.status]}</p><Link className="download-support" href="/support">Gặp vấn đề? Liên hệ hỗ trợ →</Link></section></main>;
  }

  const expiresAt = new Date(access.token.expires_at).toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

  return <main className="download-page"><section className="download-card"><div className="brand-mark large">S</div><span className="section-index download-kicker">LIÊN KẾT TẢI BẢO MẬT</span><h1>File Skill của bạn.</h1><p className="download-meta"><strong>{access.item.skill_name}</strong><span>Phiên bản {access.item.version}</span><small>Liên kết hết hạn ngày {expiresAt} · Còn {access.remaining} lượt tải</small></p><a className="primary-button inverse download-button" href={`/api/downloads/${encodeURIComponent(token)}`}>Tải Skill <span>↓</span></a><p className="download-note">File được lấy trực tiếp từ kho riêng tư của Skillroom.</p><Link className="download-support" href="/support">Gặp vấn đề? Liên hệ hỗ trợ →</Link></section></main>;
}
