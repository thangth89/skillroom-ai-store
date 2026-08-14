"use client";

import { useState } from "react";
import { PayPalCheckout } from "@/components/paypal-checkout";

type CheckoutLocale = "vi" | "en";

export function CheckoutForm({
  slug,
  locale,
  isFree,
  internationalLive,
  paypalClientId,
  providerName,
}: {
  slug: string;
  locale: CheckoutLocale;
  isFree: boolean;
  internationalLive: boolean;
  paypalClientId: string;
  providerName: string;
}) {
  const vi = locale === "vi";
  const internationalPaid = !vi && !isFree;
  const checkoutReady = !internationalPaid || (internationalLive && Boolean(paypalClientId));
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (internationalPaid) {
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError("Enter a valid email address for delivery.");
        return;
      }
      if (!agreed) {
        setError("Please agree to the digital product terms.");
        return;
      }
      if (!checkoutReady) {
        setError("International checkout is being updated. No payment has been taken.");
        return;
      }
      setError("");
      setShowPayPal(true);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(vi ? "Hãy nhập địa chỉ email hợp lệ để nhận Skill." : "Enter a valid email address for delivery.");
      return;
    }
    if (!isFree && !agreed) {
      setError("Vui lòng xác nhận email và đồng ý với điều khoản sản phẩm số.");
      return;
    }

    setError("");
    setSuccess("");
    setPending(true);

    try {
      const response = await fetch(isFree ? "/api/free-skills/claim" : "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ email, slug, locale, marketingConsent }),
      });
      const responseText = await response.text();
      let data: { success?: boolean; error?: string; orderCode?: string } = {};
      try {
        data = JSON.parse(responseText) as typeof data;
      } catch {
        data = {};
      }

      if (!response.ok || (isFree && !data.success)) {
        setError(data.error || (vi
          ? `Không thể xử lý yêu cầu (mã ${response.status}). Vui lòng thử lại.`
          : `We could not send the Skill (error ${response.status}). Please try again.`));
        return;
      }

      if (!isFree && data.orderCode) {
        window.location.assign(`/payment/${encodeURIComponent(data.orderCode)}`);
        return;
      }

      setSuccess(vi
        ? "Email đã được gửi. Liên kết tải Skill riêng tư đang trên đường tới hộp thư của bạn."
        : "Check your inbox. Your private Skill download link is on its way.");
      setEmail("");
      setAgreed(false);
      setMarketingConsent(false);
    } catch {
      setError(vi
        ? "Không thể kết nối máy chủ. Hãy kiểm tra mạng và thử lại."
        : "We could not reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (isFree && success) {
    return (
      <section className="free-claim-success" aria-live="polite" role="status">
        <span className="free-claim-success-mark" aria-hidden="true">✓</span>
        <div>
          <strong>{vi ? "Đã gửi email thành công" : "Email sent successfully"}</strong>
          <p>{success} {vi
            ? "Nếu chưa thấy sau vài phút, hãy kiểm tra thư Spam hoặc Quảng cáo."
            : "Check your Spam or Promotions folder if it does not arrive within a few minutes."}</p>
        </div>
        <button className="secondary-button" onClick={() => setSuccess("")} type="button">
          {vi ? "Dùng email khác" : "Use another email"}
        </button>
      </section>
    );
  }

  return (
    <>
      <form className="checkout-form" onSubmit={submit} noValidate>
        <label htmlFor="email">{vi ? "Email nhận Skill" : "Delivery email"}</label>
        <input
          disabled={showPayPal}
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => { setEmail(event.target.value); setError(""); setShowPayPal(false); }}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <p className="field-help">{vi
          ? "Liên kết tải riêng tư, có thời hạn sẽ được gửi tới địa chỉ này."
          : isFree
            ? "We will send a time-limited private download link to this address."
            : "We will send a time-limited private download link to this address after payment."}</p>

        {!isFree ? (
          <label className="check-row">
            <input disabled={showPayPal} type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); setError(""); setShowPayPal(false); }} />
            <span>{vi
              ? "Tôi đã kiểm tra email và đồng ý với điều khoản sản phẩm số."
              : "I have checked my delivery email, agree to the digital product terms and understand that delivery is electronic."}</span>
          </label>
        ) : null}

        {isFree ? (
          <label className="check-row optional-consent">
            <input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} />
            <span>{vi
              ? "Không bắt buộc: gửi cho tôi Skill mới và ưu đãi thỉnh thoảng."
              : "Optional: send me new Skill releases and occasional offers."}</span>
          </label>
        ) : null}

        {!checkoutReady ? (
          <div className="checkout-unavailable" role="status">
            <strong>International checkout is being updated</strong>
            <p>PayPal is not fully configured in this website environment. No payment information is collected here.</p>
          </div>
        ) : null}
        {error ? <p className="form-error" aria-live="assertive" role="alert">{error}</p> : null}

        {!showPayPal ? (
          <button className="primary-button full-button" disabled={pending || !checkoutReady} type="submit">
            {pending
              ? (vi ? "Đang xử lý…" : "Sending…")
              : isFree
                ? (vi ? "Gửi Skill miễn phí qua email" : "Email me the free Skill")
                : vi
                  ? "Tạo mã VietQR"
                  : checkoutReady ? `Continue with ${providerName}` : "Checkout temporarily unavailable"} <span>→</span>
          </button>
        ) : null}

        {!showPayPal ? (isFree ? (
          <p className="secure-note">{vi ? "Không cần thanh toán • Liên kết tải được bảo mật" : "No payment required • Your download link stays private"}</p>
        ) : vi ? (
          <p className="secure-note">Thanh toán VietQR qua payOS • Không thay đổi nội dung chuyển khoản</p>
        ) : (
          <p className="secure-note">{checkoutReady ? `Secure payment by ${providerName}` : "No payment information is collected on this page"}</p>
        )) : null}
      </form>
      {showPayPal ? (
        <PayPalCheckout
          clientId={paypalClientId}
          email={email}
          onEditEmail={() => { setShowPayPal(false); setError(""); }}
          slug={slug}
        />
      ) : null}
    </>
  );
}
