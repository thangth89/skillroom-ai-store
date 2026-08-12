import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page shell">
        <span className="section-index">LEGAL</span>
        <h1>Terms of use.</h1>
        <section>
          <h2>License to use</h2>
          <p>Each order grants the buyer a personal license to use the Skill within the scope described on its product page. Skill files may not be resold, republished, shared publicly or redistributed.</p>
          <h2>Digital products</h2>
          <p>Customers are responsible for reviewing the product description, tool requirements, included files and delivery email before completing checkout.</p>
          <h2>Free Skills</h2>
          <p>Free Skills require a valid delivery email but no payment. The same restrictions on resale, redistribution and public sharing apply.</p>
          <h2>Payments and delivery</h2>
          <p>A paid order is confirmed only after the payment provider verifies the transaction. Skillroom then sends a private, time-limited download link to the email supplied at checkout.</p>
          <h2>Refunds</h2>
          <p>Because Skills are digital products, refund eligibility depends on delivery status, download activity and a verified technical fault. Contact support with your order reference for review.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
