import { AdminShell } from "@/components/admin-shell";
import { hasEmailDeliveryConfig } from "@/lib/delivery";
import { hasAdminDataConfig, requireAdmin } from "@/lib/supabase/admin";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function getProjectHost() {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!projectUrl) return "Not available";

  try {
    return new URL(projectUrl).hostname;
  } catch {
    return "Configured";
  }
}

async function getSiteUrl() {
  const configuredUrl = (
    process.env.NEXT_PUBLIC_INTERNATIONAL_SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL
  )?.replace(/\/$/, "");

  if (configuredUrl) return configuredUrl;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  return host ? `${protocol}://${host}` : "Site URL not available";
}

export default async function AdminSettingsPage() {
  await requireAdmin();

  const lemonReady = Boolean(process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
  const emailReady = hasEmailDeliveryConfig();
  const supabaseReady = hasAdminDataConfig();
  const siteUrl = await getSiteUrl();
  const sender = process.env.EMAIL_FROM ?? "EMAIL_FROM is not configured";
  const bucket = process.env.SKILL_STORAGE_BUCKET ?? "Bucket is not configured";

  return (
    <AdminShell eyebrow="SYSTEM" title="Settings">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <span>SECURE CONFIGURATION</span>
            <h2>Server configuration status</h2>
          </div>
        </div>
        <p className="settings-security-note">
          This page only checks whether each service is configured. API keys and secrets
          remain protected in Vercel Environment Variables and are never displayed here.
        </p>
      </section>

      <section className="settings-grid">
        <article className="admin-panel">
          <span className="section-index">GLOBAL PAYMENTS</span>
          <h2>Lemon Squeezy</h2>
          <span className={`status ${lemonReady ? "ready" : "pending"}`}>
            {lemonReady ? "Connected" : "Configuration required"}
          </span>
          <p>
            {lemonReady
              ? "The webhook signing secret is available for international payment events."
              : "Add LEMONSQUEEZY_WEBHOOK_SECRET to the Vercel Preview environment."}
          </p>
          <small className="settings-value">
            Webhook: {siteUrl}/api/payments/lemonsqueezy/webhook
          </small>
          <a
            className="secondary-button"
            href="https://app.lemonsqueezy.com/settings/webhooks"
            rel="noreferrer"
            target="_blank"
          >
            Open Lemon Squeezy ↗
          </a>
        </article>

        <article className="admin-panel">
          <span className="section-index">EMAIL</span>
          <h2>Resend</h2>
          <span className={`status ${emailReady ? "ready" : "pending"}`}>
            {emailReady ? "Connected" : "Configuration required"}
          </span>
          <p>
            {emailReady
              ? "The website can deliver free Skills and support emails."
              : "Check RESEND_API_KEY and EMAIL_FROM on Vercel."}
          </p>
          <small className="settings-value">Sender: {sender}</small>
          <a
            className="secondary-button"
            href="https://resend.com/domains"
            rel="noreferrer"
            target="_blank"
          >
            Open Resend ↗
          </a>
        </article>

        <article className="admin-panel">
          <span className="section-index">DATA &amp; FILES</span>
          <h2>Supabase</h2>
          <span className={`status ${supabaseReady ? "ready" : "pending"}`}>
            {supabaseReady ? "Connected" : "Configuration required"}
          </span>
          <p>
            {supabaseReady
              ? "The shared database and private Skill storage are ready."
              : "Check the Supabase URL, Secret Key and storage bucket on Vercel."}
          </p>
          <small className="settings-value">
            Project: {getProjectHost()} · Bucket: {bucket}
          </small>
          <a
            className="secondary-button"
            href="https://supabase.com/dashboard"
            rel="noreferrer"
            target="_blank"
          >
            Open Supabase ↗
          </a>
        </article>
      </section>
    </AdminShell>
  );
}
