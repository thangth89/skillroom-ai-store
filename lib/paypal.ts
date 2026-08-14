import "server-only";

type PayPalEnvironment = "sandbox" | "live";

export type PayPalOrderResponse = {
  id: string;
  status: string;
  purchase_units?: Array<{
    custom_id?: string;
    invoice_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }>;
    };
  }>;
};

function environment(): PayPalEnvironment {
  return process.env.PAYPAL_ENVIRONMENT?.toLowerCase() === "live" ? "live" : "sandbox";
}

function apiBase() {
  return environment() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function hasPayPalConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim() &&
      process.env.PAYPAL_CLIENT_SECRET?.trim(),
  );
}

export function getPayPalEnvironment() {
  return environment();
}

async function parsePayPalResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const details = typeof payload === "object" && payload && "message" in payload
      ? String(payload.message)
      : `PayPal returned HTTP ${response.status}.`;
    throw new Error(details);
  }

  return payload as T;
}

async function accessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("PayPal is not configured.");

  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const payload = await parsePayPalResponse<{ access_token?: string }>(response);
  if (!payload.access_token) throw new Error("PayPal did not return an access token.");
  return payload.access_token;
}

async function paypalRequest<T>(path: string, init: RequestInit, requestId?: string) {
  const token = await accessToken();
  return parsePayPalResponse<T>(await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
      ...init.headers,
    },
    cache: "no-store",
  }));
}

function usdValue(cents: number) {
  return (cents / 100).toFixed(2);
}

export async function createPayPalOrder(input: {
  localOrderId: string;
  orderCode: string;
  skillName: string;
  amountCents: number;
}) {
  const value = usdValue(input.amountCents);
  return paypalRequest<PayPalOrderResponse>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: "skillroom-order",
        custom_id: input.localOrderId,
        invoice_id: input.orderCode,
        description: input.skillName.slice(0, 127),
        amount: {
          currency_code: "USD",
          value,
          breakdown: { item_total: { currency_code: "USD", value } },
        },
        items: [{
          name: input.skillName.slice(0, 127),
          quantity: "1",
          category: "DIGITAL_GOODS",
          unit_amount: { currency_code: "USD", value },
        }],
      }],
      application_context: {
        brand_name: "Skillroom",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  }, input.localOrderId);
}

export async function capturePayPalOrder(paypalOrderId: string, requestId: string) {
  return paypalRequest<PayPalOrderResponse>(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    { method: "POST", body: "{}" },
    requestId,
  );
}

export async function verifyPayPalWebhook(input: {
  authAlgo: string;
  certUrl: string;
  transmissionId: string;
  transmissionSig: string;
  transmissionTime: string;
  webhookEvent: unknown;
}) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID is not configured.");

  return paypalRequest<{ verification_status?: string }>(
    "/v1/notifications/verify-webhook-signature",
    {
      method: "POST",
      body: JSON.stringify({
        auth_algo: input.authAlgo,
        cert_url: input.certUrl,
        transmission_id: input.transmissionId,
        transmission_sig: input.transmissionSig,
        transmission_time: input.transmissionTime,
        webhook_id: webhookId,
        webhook_event: input.webhookEvent,
      }),
    },
  );
}
