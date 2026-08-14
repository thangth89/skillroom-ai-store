"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type PayPalActions = { restart?: () => Promise<void> };
type PayPalButtonsInstance = { render: (element: HTMLElement) => Promise<void>; close?: () => Promise<void> };
type PayPalNamespace = {
  Buttons: (options: {
    style?: Record<string, string | boolean | number>;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }, actions: PayPalActions) => Promise<void>;
    onCancel: () => void;
    onError: (error: unknown) => void;
  }) => PayPalButtonsInstance;
};

declare global {
  interface Window { paypal?: PayPalNamespace }
}

function messageFromResponse(value: unknown, fallback: string) {
  return typeof value === "object" && value && "error" in value && typeof value.error === "string"
    ? value.error
    : fallback;
}

export function PayPalCheckout({ clientId, email, onEditEmail, slug }: { clientId: string; email: string; onEditEmail: () => void; slug: string }) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<PayPalButtonsInstance | null>(null);
  const [sdkReady, setSdkReady] = useState(Boolean(typeof window !== "undefined" && window.paypal));
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !container.current || instance.current) return;

    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", shape: "rect", label: "paypal", height: 48 },
      async createOrder() {
        setError("");
        const response = await fetch("/api/payments/paypal/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ email, slug }),
        });
        const data = await response.json().catch(() => ({})) as { id?: string; error?: string };
        if (!response.ok || !data.id) throw new Error(messageFromResponse(data, "PayPal could not start this checkout."));
        return data.id;
      },
      async onApprove(data, actions) {
        setProcessing(true);
        setError("");
        try {
          const response = await fetch(`/api/payments/paypal/orders/${encodeURIComponent(data.orderID)}/capture`, {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
          });
          const result = await response.json().catch(() => ({})) as { success?: boolean; orderCode?: string; error?: string };
          if (!response.ok || !result.success || !result.orderCode) {
            const message = messageFromResponse(result, "PayPal could not complete this payment.");
            if (message.includes("INSTRUMENT_DECLINED") && actions.restart) {
              await actions.restart();
              return;
            }
            throw new Error(message);
          }
          window.location.assign(`/payment/success?order=${encodeURIComponent(result.orderCode)}`);
        } catch (captureError) {
          setError(captureError instanceof Error ? captureError.message : "PayPal could not complete this payment.");
        } finally {
          setProcessing(false);
        }
      },
      onCancel() {
        setError("Checkout was cancelled. You can try again when you are ready.");
      },
      onError(paypalError) {
        setError(paypalError instanceof Error ? paypalError.message : "PayPal checkout is temporarily unavailable.");
      },
    });
    instance.current = buttons;
    buttons.render(container.current).catch((renderError) => {
      instance.current = null;
      setError(renderError instanceof Error ? renderError.message : "PayPal checkout could not load.");
    });

    return () => {
      void instance.current?.close?.();
      instance.current = null;
    };
  }, [email, sdkReady, slug]);

  const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;

  return (
    <div className="paypal-checkout" aria-busy={processing}>
      <Script id="paypal-js-sdk" onError={() => setError("PayPal checkout could not load.")} onReady={() => setSdkReady(true)} src={sdkUrl} strategy="afterInteractive" />
      <div className="paypal-checkout-head">
        <div><strong>Choose how to pay</strong><span>PayPal or an eligible debit/credit card</span></div>
        <button onClick={onEditEmail} type="button">Edit email</button>
      </div>
      {processing ? <p className="paypal-processing" role="status">Confirming your payment and preparing the email…</p> : null}
      {error ? <p className="form-error" aria-live="assertive" role="alert">{error}</p> : null}
      <div className={processing ? "paypal-buttons disabled" : "paypal-buttons"} ref={container} />
      <p className="secure-note">Sandbox checkout • No real money is charged while PayPal Sandbox credentials are active</p>
    </div>
  );
}
