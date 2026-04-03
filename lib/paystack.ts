import "server-only";

import { createHmac } from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${getSecretKey()}`,
    "Content-Type": "application/json",
  };
}

// ─── Initialize Transaction ─────────────────────────────────────────
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo (R1,000 = 100000)
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      currency: "ZAR",
      callback_url: params.callbackUrl,
      metadata: params.metadata || {},
    }),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(`Paystack init error: ${data.message}`);
  }

  return data.data;
}

// ─── Verify Transaction ─────────────────────────────────────────────
export async function verifyTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  currency: string;
  paid_at: string;
  metadata: Record<string, unknown>;
  customer: { email: string };
}> {
  const res = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: getHeaders() },
  );

  const data = await res.json();
  if (!data.status) {
    throw new Error(`Paystack verify error: ${data.message}`);
  }

  return data.data;
}

// ─── Create Subscription Plan ───────────────────────────────────────
export async function createCustomerSubscription(params: {
  customerEmail: string;
  planCode: string;
}): Promise<{ subscription_code: string; email_token: string }> {
  // First, ensure customer exists
  const customerRes = await fetch(`${PAYSTACK_BASE}/customer`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ email: params.customerEmail }),
  });
  await customerRes.json(); // Create or return existing

  const res = await fetch(`${PAYSTACK_BASE}/subscription`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      customer: params.customerEmail,
      plan: params.planCode,
    }),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(`Paystack subscription error: ${data.message}`);
  }

  return data.data;
}

// ─── Validate Webhook Signature ─────────────────────────────────────
export function validateWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const hash = createHmac("sha512", getSecretKey())
    .update(body)
    .digest("hex");
  return hash === signature;
}

// ─── Get Current Month Name ─────────────────────────────────────────
export function getCurrentMonth(): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months[new Date().getMonth()];
}
