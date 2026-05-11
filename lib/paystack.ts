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
//
// Pricing (May 2026):
//   - Standard: R1,020 = 102,000 kobo (R1,000 contribution + 2% service fee)
//   - VIP:      R1,050 = 105,000 kobo (R1,000 contribution + 5% service fee)
//
// IMPORTANT: when these amounts are changed, the Paystack Plan
// configured in the dashboard (and referenced via the
// PAYSTACK_PLAN_CODE_STANDARD / PAYSTACK_PLAN_CODE_VIP env vars)
// MUST be updated to match — Paystack rejects transactions where
// the request amount differs from the plan's configured amount.
export function getAmountForPlan(plan: string): number | null {
  switch (plan) {
    case "standard":
      return 102000;
    case "vip":
      return 105000;
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

// ─── Get Subscription Details ───────────────────────────────────────
// Fetches a single Paystack subscription by code. Used by the admin
// pending-actions surface to show a countdown to each member's next
// billing date — knowing "you have 3 days to cancel" makes admin
// prioritisation obvious.
//
// Returns null on lookup failure rather than throwing — the admin
// dashboard should still render (with an "unknown" countdown) even
// when one of N Paystack calls errors out.
export async function getSubscriptionDetails(
  subscriptionCode: string,
): Promise<{
  status: string;
  nextPaymentDate: string | null;
  amount: number | null;
  email: string | null;
} | null> {
  try {
    const res = await fetch(
      `${PAYSTACK_BASE}/subscription/${encodeURIComponent(subscriptionCode)}`,
      {
        headers: getHeaders(),
        // Don't cache — billing dates roll forward as charges land.
        cache: "no-store",
      },
    );
    const data = await res.json();
    if (!data.status) return null;
    return {
      status: (data.data?.status as string) ?? "unknown",
      nextPaymentDate: (data.data?.next_payment_date as string) ?? null,
      amount: (data.data?.amount as number) ?? null,
      email: (data.data?.customer?.email as string) ?? null,
    };
  } catch (err) {
    console.error(
      `[paystack getSubscriptionDetails] ${subscriptionCode} failed:`,
      err,
    );
    return null;
  }
}

// ─── Disable Subscription ───────────────────────────────────────────
// Stops a recurring Paystack subscription so it won't charge again on
// the next billing date. Used when a member downgrades from Standard
// to Basic on the portal — we cancel their auto-debit programmatically
// instead of relying on admin to do it from the Paystack dashboard.
//
// Paystack requires BOTH the subscription code (SUB_xxx) and the
// email_token returned alongside it on creation. We persist the
// subscription_code on the member (in the notes blob); the email_token
// is re-fetched via GET /subscription/<code> at disable time, so the
// caller only needs to know the code.
export async function disableSubscription(
  subscriptionCode: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Look up the subscription to grab its email_token.
  let emailToken: string | null = null;
  try {
    const lookupRes = await fetch(
      `${PAYSTACK_BASE}/subscription/${encodeURIComponent(subscriptionCode)}`,
      { headers: getHeaders() },
    );
    const lookupData = await lookupRes.json();
    if (!lookupData.status) {
      return {
        ok: false,
        error: `Paystack lookup failed: ${lookupData.message ?? "unknown"}`,
      };
    }
    emailToken = lookupData.data?.email_token ?? null;
  } catch (err) {
    return {
      ok: false,
      error: `Paystack lookup error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  if (!emailToken) {
    return { ok: false, error: "Paystack lookup returned no email_token" };
  }

  // POST /subscription/disable — required body is { code, token }.
  // Idempotency: an already-cancelled subscription returns
  // status:false with a "not active" message, which we still treat
  // as success for the caller's intent.
  try {
    const res = await fetch(`${PAYSTACK_BASE}/subscription/disable`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
    });
    const data = await res.json();
    if (data.status) return { ok: true };
    const msg = (data.message ?? "").toLowerCase();
    if (msg.includes("not active") || msg.includes("already")) {
      return { ok: true };
    }
    return { ok: false, error: `Paystack disable failed: ${data.message}` };
  } catch (err) {
    return {
      ok: false,
      error: `Paystack disable error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
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
