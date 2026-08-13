"use client";

import { useState } from "react";

export function CheckoutForm({
  slug,
  isFree,
  checkoutUrl,
}: {
  slug: string;
  isFree: boolean;
  checkoutUrl: string | null;
}) {
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address for delivery.");
      return;
    }
    if (!isFree && !agreed) {
      setError("Please agree to the digital product terms.");
      return;
    }
    setError("");
    setSuccess("");

    if (!isFree) {
      if (!checkoutUrl) {
        setError("Checkout is not available for this Skill yet. No payment has been taken.");
        return;
      }

      try {
        const url = new URL(checkoutUrl);
        url.searchParams.set("checkout[email]", email);
        url.searchParams.set("checkout[custom][skill_slug]", slug);
        url.searchParams.set("checkout[custom][source]", "skillroom_en");
        window.location.assign(url.toString());
      } catch {
        setError("The secure checkout link is invalid. Please contact support.");
      }
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/free-skills/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ email, slug, marketingConsent }),
      });
      const responseText = await response.text();
      let data: { success?: boolean; error?: string } = {};
      try {
        data = JSON.parse(responseText) as typeof data;
      } catch {
        data = {};
      }
      if (!response.ok || !data.success) {
        setError(
          data.error ||
            `We could not send the Skill (error ${response.status}). Please try again.`,
        );
        return;
      }
      setSuccess("Check your inbox. Your private Skill download link is on its way.");
      setEmail("");
      setAgreed(false);
      setMarketingConsent(false);
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (isFree && success) {
    return (
      <section className="free-claim-success" aria-live="polite" role="status">
        <span className="free-claim-success-mark" aria-hidden="true">✓</span>
        <div>
          <strong>Email sent successfully</strong>
          <p>{success} Check your Spam or Promotions folder if it does not arrive within a few minutes.</p>
        </div>
        <button
          className="secondary-button"
          onClick={() => setSuccess("")}
          type="button"
        >
          Use another email
        </button>
      </section>
    );
  }

  return (
    <form className="checkout-form" onSubmit={submit} noValidate>
      <label htmlFor="email">Delivery email</label>
      <input
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => { setEmail(event.target.value); setError(""); }}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <p className="field-help">We will send a time-limited private download link to this address.</p>
      {!isFree ? (
        <label className="check-row">
          <input type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); setError(""); }} />
          <span>I have checked my email and agree to the digital product terms.</span>
        </label>
      ) : null}
      {isFree ? (
        <label className="check-row optional-consent">
          <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />
          <span>Optional: send me new Skill releases and occasional offers.</span>
        </label>
      ) : null}
      {error ? <p className="form-error" aria-live="assertive" role="alert">{error}</p> : null}
      {success ? <p className="form-success" role="status">{success}</p> : null}
      <button className="primary-button full-button" disabled={pending} type="submit">
        {pending ? "Sending…" : isFree ? "Email me the free Skill" : "Continue to secure checkout"} <span>→</span>
      </button>
      {isFree ? (
        <p className="secure-note">No payment required • Your download link stays private</p>
      ) : (
        <><div className="payment-method-list" aria-label="Supported payment methods"><span>VISA</span><span>Mastercard</span><span>PayPal</span><span>Apple Pay</span><span>G Pay</span></div><p className="secure-note">Secure payment and digital delivery by Lemon Squeezy</p></>
      )}
    </form>
  );
}
