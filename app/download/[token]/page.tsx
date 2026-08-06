import Link from "next/link";

export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="download-page"><section><div className="brand-mark large">S</div><span className="section-index">LIÊN KẾT TẢI BẢO MẬT</span><h1>File Skill của bạn.</h1><p>Token <code>{token.slice(0, 10)}…</code> sẽ được máy chủ kiểm tra thời hạn và số lượt tải trước khi cho phép tải file.</p><button className="primary-button" disabled>Tải Skill</button><small>Nút sẽ hoạt động sau khi kết nối kho file riêng tư.</small><Link href="/support">Gặp vấn đề? Liên hệ hỗ trợ →</Link></section></main>;
}
