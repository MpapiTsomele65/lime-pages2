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
// When `planCode` is supplied, Paystack treats this as the first installment
// of a subscription: it charges the plan amount immediately, tokenises the
// card, and auto-debits the same card every interval thereafter.
//
// IMPORTANT: Despite plan-based subscriptions deriving their recurring price
// from the plan, Paystack's `transaction/initialize` endpoint REQUIRES
// `amount` to be present in every request — without it the API returns
// HTTP 400 "Invalid Amount Sent". When initialising a subscription, callers
// must pass the plan's amount (in kobo) so the validation passes; Paystack
// will then use the plan to drive ongoing billing.
//
// When `planCode` is absent, this is a plain one-time charge for `amount` kobo.
export async function initializeTransaction(params: {
  email: string;
  amount: number; // in kobo (R1,000 = 100000) — required even with planCode
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  planCode?: string;
}): Promise<{ authorization_url: string; access_code: string; reference: string }> {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: params.amount,
    currency: "ZAR",
    callback_url: params.callbackUrl,
    metadata: params.metadata || {},
  };

  if (params.planCode) {
    body.plan = params.planCode;
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(`Paystack init error: ${data.message}`);
  }

  return data.data;
}

// ─── Plan Amount Resolution ─────────────────────────────────────────
// Maps a Lehumo plan key to its kobo amount for `transaction/initialize`.
// Must match the amount configured on the corresponding Paystack Plan.
// Standard: R1,019.90 = 101,990 kobo (R1,000 contribution + R19.90 fee).
export function getAmountForPlan(plan: string): number | null {
  switch (plan) {
    case "standard":
      return 101990;
    case "vip":
      // Coming soon — no amount configured yet.
      return null;
    default:
      return null;
  }
}

// ─── Plan Code Resolution ───────────────────────────────────────────
// Maps a Lehumo plan key to the matching Paystack Plan code from env vars.
// Returns null for plans that don't use Paystack subscriptions (basic = EFT,
// vip = currently coming-soon).
export function getPlanCodeForPlan(plan: string): string | null {
  switch (plan) {
    case "standard":
      return process.env.PAYSTACK_PLAN_CODE_STANDARD || null;
    case "vip":
      return process.env.PAYSTACK_PLAN_CODE_VIP || null;
    default:
      return null;
  }
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
