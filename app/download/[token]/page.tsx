import Link from "next/link";
import { DOWNLOAD_LIMIT, getDownloadAccess } from "@/lib/downloads";

export const dynamic = "force-dynamic";

export default async function DownloadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const access = await getDownloadAccess(token);

  const message = {
    invalid: "This download link is invalid or no longer exists.",
    expired: "This download link has expired. Contact support with your reference number.",
    exhausted: `This link has reached its ${DOWNLOAD_LIMIT}-download limit.`,
    unavailable: "The Skill file is temporarily unavailable. Contact support so we can check it.",
  } as const;

  if (access.status !== "ready") {
    return <main className="download-page"><section className="download-card"><div className="brand-mark large">S</div><span className="section-index download-kicker">PRIVATE DOWNLOAD</span><h1>We cannot open this file.</h1><p className="download-meta">{message[access.status]}</p><Link className="download-support" href="/support">Having trouble? Contact support →</Link></section></main>;
  }

  const expiresAt = new Date(access.token.expires_at).toLocaleDateString("en-US", {
    timeZone: "UTC",
  });

  return <main className="download-page"><section className="download-card"><div className="brand-mark large">S</div><span className="section-index download-kicker">PRIVATE DOWNLOAD</span><h1>Your Skill file.</h1><p className="download-meta"><strong>{access.item.skill_name}</strong><span>Version {access.item.version}</span><small>Link expires {expiresAt} · {access.remaining} downloads remaining</small></p><a className="primary-button inverse download-button" href={`/api/downloads/${encodeURIComponent(token)}`}>Download Skill <span>↓</span></a><p className="download-note">The file is delivered directly from Skillroom&apos;s private storage.</p><Link className="download-support" href="/support">Having trouble? Contact support →</Link></section></main>;
}
