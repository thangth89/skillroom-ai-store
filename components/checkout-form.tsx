"use client";

import { useState } from "react";

export function CheckoutForm({ slug, isFree }: { slug: string; isFree: boolean }) {
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
    if (!agreed) {
      setError("Please agree to the digital product terms.");
      return;
    }
    setError("");
    setSuccess("");

    if (!isFree) {
      setError("International checkout is not connected yet. No payment has been taken.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/free-skills/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug, marketingConsent }),
      });
      const data = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !data.success) {
        setError(data.error || "We could not send the Skill. Please try again.");
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
      <label className="check-row">
        <input type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); setError(""); }} />
        <span>I have checked my email and agree to the digital product terms.</span>
      </label>
      {isFree ? (
        <label className="check-row optional-consent">
          <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />
          <span>Optional: send me new Skill releases and occasional offers.</span>
        </label>
      ) : null}
      {error && <p className="form-error" role="alert">{error}</p>}
      {success ? <p className="form-success" role="status">{success}</p> : null}
      <button className="primary-button full-button" disabled={pending} type="submit">
        {pending ? "Sending…" : isFree ? "Email me the free Skill" : "Continue to secure checkout"} <span>→</span>
      </button>
      {isFree ? (
        <p className="secure-note">No payment required • Your download link stays private</p>
      ) : (
        <><div className="payment-method-list" aria-label="Planned payment methods"><span>VISA</span><span>Mastercard</span><span>PayPal</span><span>Apple Pay</span><span>G Pay</span></div><p className="secure-note">Checkout interface ready • Lemon Squeezy connection pending</p></>
      )}
    </form>
  );
}
