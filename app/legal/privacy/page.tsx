import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="legal-page shell">
        <span className="section-index">LEGAL</span>
        <h1>Privacy policy.</h1>
        <section>
          <h2>Information we collect</h2>
          <p>We store the delivery email, product reference, order status and limited download activity needed to deliver Skills and provide customer support.</p>
          <h2>How we use email</h2>
          <p>Your email is used to deliver the requested Skill and send essential order or support messages. Marketing email is optional and requires a separate choice.</p>
          <h2>Payment information</h2>
          <p>Card and wallet details are handled by the hosted payment provider. Skillroom does not store full card numbers or security codes.</p>
          <h2>File security</h2>
          <p>Skill files remain in private storage. Download links expire and have a limited number of uses.</p>
          <h2>Third parties</h2>
          <p>We use service providers for payments, email delivery, hosting and private file storage only as needed to operate the store.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
