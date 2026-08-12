import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = { title: "How it works" };

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero shell">
          <span className="section-index">HELP CENTER</span>
          <h1>From video preview to a Skill in your inbox.</h1>
          <p>Everything you need to choose, receive and use a digital Skill with confidence.</p>
        </section>
        <section className="faq shell">
          <article><span>01</span><div><h2>How do free Skills work?</h2><p>Choose a Skill marked Free, enter a valid email address and we will send a private download link. No card or payment account is required.</p></div></article>
          <article><span>02</span><div><h2>Which payment methods will be available?</h2><p>Premium checkout is designed for Visa, Mastercard, PayPal, Apple Pay and Google Pay. The options shown will depend on the customer&apos;s device, browser and location.</p></div></article>
          <article><span>03</span><div><h2>Are the preview videos real outputs?</h2><p>Yes. Each video represents the type of result produced with that Skill. Videos load only after you click Watch video, so the site does not consume video data in the background.</p></div></article>
          <article><span>04</span><div><h2>What if I enter the wrong email?</h2><p>Contact support with your checkout reference and payment receipt. Delivery is corrected only after the transaction has been verified.</p></div></article>
          <article><span>05</span><div><h2>How long does the download link last?</h2><p>The private link is valid for 7 days and up to 5 downloads. Keep it private and save the Skill file to your own device.</p></div></article>
          <article><span>06</span><div><h2>Are updates included?</h2><p>Update terms are listed on each product page, so you know exactly which version and files are included.</p></div></article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
