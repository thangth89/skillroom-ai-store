import Link from "next/link";
import { DOWNLOAD_LIMIT, getDownloadAccess } from "@/lib/downloads";
import { getStoreLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, locale] = await Promise.all([params, getStoreLocale()]);
  const vi = locale === "vi";
  const access = await getDownloadAccess(token);

  const message = vi ? {
    invalid: "Liên kết tải không hợp lệ hoặc không còn tồn tại.",
    expired: "Liên kết tải đã hết hạn. Hãy liên hệ hỗ trợ kèm mã tham chiếu.",
    exhausted: `Liên kết đã đạt giới hạn ${DOWNLOAD_LIMIT} lượt tải.`,
    unavailable: "File Skill đang tạm thời không khả dụng. Hãy liên hệ hỗ trợ để được kiểm tra.",
  } as const : {
    invalid: "This download link is invalid or no longer exists.",
    expired: "This download link has expired. Contact support with your reference number.",
    exhausted: `This link has reached its ${DOWNLOAD_LIMIT}-download limit.`,
    unavailable: "The Skill file is temporarily unavailable. Contact support so we can check it.",
  } as const;

  if (access.status !== "ready") {
    return <main className="download-page"><section className="download-card"><div className="brand-mark large">S</div><span className="section-index download-kicker">{vi ? "LIÊN KẾT TẢI BẢO MẬT" : "PRIVATE DOWNLOAD"}</span><h1>{vi ? "Không thể mở file này." : "We cannot open this file."}</h1><p className="download-meta">{message[access.status]}</p><Link className="download-support" href="/support">{vi ? "Gặp vấn đề? Liên hệ hỗ trợ" : "Having trouble? Contact support"} →</Link></section></main>;
  }

  const expiresAt = new Date(access.token.expires_at).toLocaleDateString(vi ? "vi-VN" : "en-US", {
    timeZone: "UTC",
  });

  return <main className="download-page"><section className="download-card"><div className="brand-mark large">S</div><span className="section-index download-kicker">{vi ? "LIÊN KẾT TẢI BẢO MẬT" : "PRIVATE DOWNLOAD"}</span><h1>{vi ? "File Skill của bạn." : "Your Skill file."}</h1><p className="download-meta"><strong>{access.item.skill_name}</strong><span>{vi ? "Phiên bản" : "Version"} {access.item.version}</span><small>{vi ? `Liên kết hết hạn ${expiresAt} · còn ${access.remaining} lượt tải` : `Link expires ${expiresAt} · ${access.remaining} downloads remaining`}</small></p><a className="primary-button inverse download-button" href={`/api/downloads/${encodeURIComponent(token)}`}>{vi ? "Tải Skill" : "Download Skill"} <span>↓</span></a><p className="download-note">{vi ? "File được lấy trực tiếp từ kho riêng tư của Skillroom." : "The file is delivered directly from Skillroom's private storage."}</p><Link className="download-support" href="/support">{vi ? "Gặp vấn đề? Liên hệ hỗ trợ" : "Having trouble? Contact support"} →</Link></section></main>;
}
