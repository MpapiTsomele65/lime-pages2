import { z } from "zod";

import { validateEmail } from "@/lib/email-validation";

/**
 * Reusable Zod email field with typo-aware validation.
 *
 * Wraps `validateEmail` (lib/email-validation.ts) so every form schema
 * gets the same dictionary-based typo blocking. The user-facing message
 * surfaces the suggested correction directly (e.g. `"Did you mean
 * lond.kwinda@gmail.com?"`) — that copy then renders in the wizard's
 * inline error and in the API's 400 response details.
 *
 * Why `superRefine` instead of `.email().refine(...)`: we want a single
 * gate that handles syntax + typo correction, returning the most
 * actionable message. Stacking `.email()` first would surface
 * `"Invalid email"` before our suggestion ever runs.
 */
export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .superRefine((val, ctx) => {
    const result = validateEmail(val);
    if (!result.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.reason ?? "Please enter a valid email address",
      });
    }
  });

/**
 * Optional flavour of `emailField` for fields like beneficiary email
 * where the user can leave the box blank but, if they fill it, we
 * still want to catch typos. Empty string ("") and undefined both
 * pass; anything non-empty goes through the same typo dictionary.
 */
export const optionalEmailField = z
  .string()
  .trim()
  .max(200, "Email is too long")
  .optional()
  .superRefine((val, ctx) => {
    if (!val) return;
    const result = validateEmail(val);
    if (!result.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.reason ?? "Please enter a valid email address",
      });
    }
  });

// ─── Airtable Field IDs ─────────────────────────────────────────────
export const AIRTABLE_FIELDS = {
  fullName: "fldHKLMVnWZXIAqSd",
  memberNumber: "fldYWZDCt3xL335xH",
  email: "fld849lrKZ1suGQAC",
  phone: "fldyHdgqfMyaA0qrY",
  status: "fldRLmj83nad74ce3",
  kycStatus: "fld6ziBOUgGNVMnkA",
  source: "fldHT2KWI4fh2E6C0",
  notes: "fldKKvYST9FxOyfND",
  // ── KYC / identity fields (added Apr 2026 in Tier 2A schema migration) ──
  // Captured on Step 3 of the onboarding wizard and via the member portal.
  idType: "fldMS1ht7AZmly9IS",
  idNumber: "fldZqNlioxhtRIMAY",
  residentialAddress: "fldi5lWpTW8b5t690",
  kycIdDocument: "fldmvfGp7asEwEB7i",
  kycProofOfAddress: "fldkKd5RFtAZ5uivc",
  kycSubmittedAt: "flde48OYccGxnkV04",
  kycVerifiedAt: "fld9RKaIVL5RAvhcT",
  // ── Next-of-kin / beneficiary fields (added Apr 2026 per investor info-session
  //    next-step "Collect beneficiary details immediately"). One beneficiary
  //    captured pre-Phase-2 — multi-beneficiary splits land with the trust
  //    paperwork after year five. ──
  beneficiaryFirstName: "fldTmdNgwr2LGrEcx",
  beneficiarySurname: "fldQwJ9DZ7wtaFAEK",
  beneficiaryRelationship: "fldDQqPFhQliGTX3L",
  beneficiaryPhone: "fldUVPJiETuyypK2i",
  beneficiaryEmail: "flddo4fRLXr4ftwSW",
  beneficiaryAddress: "fldivvdpebdiXn7TI",
  beneficiaryUpdatedAt: "fldkUJbalfT5lW6oC",
  // ── Active loan tracking (added Apr 2026 for the Emergency Access Monitor).
  //    Per Cost.tsx + the 21 April investor session, members can hold one
  //    active loan at a time, so the loan ledger is flattened onto the
  //    Member record (no separate Loans table for v1). When
  //    activeLoanBalance is 0 / unset, the member has no outstanding loan. ──
  activeLoanBalance: "fld70n897jjS4st8W",
  activeLoanIssuedAt: "flddkKeNUDWCrHrsh",
  activeLoanType: "fld9GqPKfrJMoeL2d",
  // Plan & Source-of-Funds still ride along in `notes` — add dedicated
  // columns later if/when reporting needs them as first-class fields.
  // plan: "fldXXXXXXXXXXXXXXX",
  // sourceOfFunds: "fldXXXXXXXXXXXXXXX",
} as const;

export const MONTH_FIELDS: Record<string, string> = {
  Jan: "fld39hRdSczFxsBZD",
  Feb: "fldej4QBGlVgyw5hE",
  Mar: "fldC4GdePzxpT3DAo",
  Apr: "fldij1iXg5fEPHxuj",
  May: "fldFa7jFmAOs8TlXs",
  Jun: "fldTsAne8lrMx72tr",
  Jul: "fld6Boc4VKY14S4zp",
  Aug: "fldGalDJkRLqus3fw",
  Sep: "fldod9aZI6svSuB2j",
  Oct: "fldXh7YLslalpnFzD",
  Nov: "fldoQTcbjrEipIjLw",
  Dec: "flddnHgLgbCkHvxVW",
};

export const MONTH_NAMES = Object.keys(MONTH_FIELDS);

/**
 * Order in which contribution months appear on member-facing UI.
 *
 * Lehumo collects from 1 Jun 2026 onwards, so "Jun" should be the *first*
 * unpaid month for new members — not "Jan". Use this instead of
 * MONTH_NAMES anywhere we surface "next month due" / payment-card
 * ordering. Admin/reporting views can keep MONTH_NAMES (Jan-first
 * calendar order) where that makes more sense.
 */
export const CONTRIBUTION_MONTH_ORDER: ReadonlyArray<string> = [
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
];

/**
 * First contribution due date — 1 Jun 2026 00:00 SAST (UTC+2).
 *
 * Members onboarding before this date shouldn't be told they're "behind"
 * on Jan-May contributions, so portal/admin UI gates payment prompts on
 * `isBeforeLaunch()`.
 */
export const LEHUMO_LAUNCH_DATE_ISO = "2026-06-01T00:00:00+02:00";

/**
 * KYC deadline — members can join, set up payment, and start contributing
 * without KYC fully complete, but ALL members must have a verified
 * Complete KYC status by this date to stay Active. After this date,
 * un-verified members move to On Hold pending document submission.
 *
 * 15 August 2026 chosen as ~2.5 months of runway from launch (1 June),
 * giving members reasonable time to track down ID/proof-of-address
 * docs without the pre-launch crunch.
 *
 * Surfaces as a friendly countdown chip on the portal's KycStatusTracker
 * (only when status ≠ Complete) and as a sub-line on the admin
 * "KYC Pending" stat tile.
 */
export const LEHUMO_KYC_DEADLINE_ISO = "2026-08-15T23:59:59+02:00";

export interface KycDeadlineInfo {
  /** Days remaining until the deadline (floored, clamped to 0). */
  daysRemaining: number;
  /** True once we're past the deadline — admin needs to action. */
  isPast: boolean;
  /** ISO date string for display purposes, e.g. "2026-08-15". */
  deadlineIso: string;
  /** Tier for colour-coding: "ok" (>30d), "warn" (8–30d), "urgent" (≤7d), "past". */
  tier: "ok" | "warn" | "urgent" | "past";
}

export function getKycDeadlineInfo(now: Date = new Date()): KycDeadlineInfo {
  const deadline = new Date(LEHUMO_KYC_DEADLINE_ISO);
  const diffMs = deadline.getTime() - now.getTime();
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isPast = diffMs < 0;
  const daysRemaining = Math.max(0, days);
  const tier: KycDeadlineInfo["tier"] = isPast
    ? "past"
    : daysRemaining <= 7
      ? "urgent"
      : daysRemaining <= 30
        ? "warn"
        : "ok";
  return {
    daysRemaining,
    isPast,
    deadlineIso: LEHUMO_KYC_DEADLINE_ISO.slice(0, 10),
    tier,
  };
}

/**
 * The first period the trust officially expects a contribution against.
 * Anything before this (e.g. a pre-existing May 2026 row in the schedule,
 * or a smoke-test row from May) is treated as "not yet on the books" by
 * the contribution ledger — it doesn't inflate the goal, it doesn't show
 * up as "due", and it doesn't push members into "1 month behind" copy
 * pre-launch. Pre-launch payments are routed to this period via
 * `getCreditMonthAndPeriod()` so members never accidentally credit a row
 * the schedule isn't actually tracking.
 */
export const LEHUMO_FIRST_DUE_PERIOD = "2026-06";

/**
 * Last period the trust officially expects a contribution against —
 * end of the 60-month schedule (Jun 2026 → May 2031 inclusive).
 * Used as the paired post-trust bookend to LEHUMO_FIRST_DUE_PERIOD:
 * cron reminders skip when the current SAST period is past this
 * value, so we don't email members about a phantom "2031-06" or
 * later contribution after the trust wraps.
 */
export const LEHUMO_LAST_DUE_PERIOD = "2031-05";

export function isBeforeLaunch(now: Date = new Date()): boolean {
  return now.getTime() < new Date(LEHUMO_LAUNCH_DATE_ISO).getTime();
}

// ─── Status Values ──────────────────────────────────────────────────
export const MEMBER_STATUS = {
  prospect: "Prospect",
  onboarding: "Onboarding",
  active: "Active",
  onHold: "On Hold",
  exited: "Exited",
} as const;

export const KYC_STATUS = {
  notStarted: "Not Started",
  docsRequested: "Docs Requested",
  inProgress: "In Progress",
  complete: "Complete",
} as const;

// ─── Airtable SingleSelect choice ID → name maps ────────────────────
// When using returnFieldsByFieldId=true, Airtable returns the choice ID
// (e.g. "selJHkVh1Jc2ZtdUr") instead of the display name. These maps let
// us resolve those back to human-readable names in parseRecord.
export const STATUS_CHOICE_ID_TO_NAME: Record<string, string> = {
  selhvEexF8pU2Bilk: "Prospect",
  selBIASB38yyxn9gn: "Onboarding",
  selJHkVh1Jc2ZtdUr: "Active",
  selGCXWVPgjRcvgTm: "On Hold",
  selRlwsyYBW5RRrci: "Exited",
};

export const KYC_CHOICE_ID_TO_NAME: Record<string, string> = {
  selow6jXoCUoyiqMF: "Not Started",
  sel4lpJ1hUv0B11L9: "Docs Requested",
  selJ3whjq2wII83Ag: "In Progress",
  sel3QJS7R6x9KYRp2: "Complete",
};

export const SOURCE_CHOICE_ID_TO_NAME: Record<string, string> = {
  selRzQ2zILzZd91UX: "Google",
  selFcQzXVkR6bDX2k: "Instagram",
  selsnnDJfcFjECMGl: "Referral",
  sel9hpse2xMsKXAzg: "WhatsApp",
  seltpSSM4UEbnJzNr: "Direct",
};

export const ID_TYPE_CHOICE_ID_TO_NAME: Record<string, string> = {
  selu73LPS0rKoSq7c: "SA ID",
  sel2aXQ83h42dEBkU: "Passport",
};

// ─── Contributions table ────────────────────────────────────────────
// Linked table (one row per member per month) introduced for the 60-month
// trust lifecycle (Jun 2026 → May 2031). Replaces the legacy 12-boolean-
// column model on the Members table — that shape couldn't track the same
// month across multiple years and had no room for payment metadata
// (amount, source, payment ref, reconciliation).
//
// Rollout is phased:
//   Phase 1 (this commit) — schema + helper layer, no UI cutover
//   Phase 2 — backfill script for the 24 existing members
//   Phase 3 — PaymentCard / ContributionGrid / admin views read here
//   Phase 4 — drop the old MONTH_FIELDS columns
//
// Until Phase 3 lands, the legacy MONTH_FIELDS shape above remains the
// source of truth for member-facing UI.

/** Airtable table ID for the Contributions table. Lives on the same
 *  base as Members (`AIRTABLE_BASE_ID`). */
export const CONTRIBUTIONS_TABLE_ID = "tblN9IO7pgfaMRE2f";

/**
 * Field IDs on the Contributions table. Stable across schema changes,
 * unlike field names — always reference these in Airtable API calls.
 */
export const CONTRIBUTION_FIELDS = {
  /** Primary field. Format `{MemberNumber}-{YYYY-MM}`, e.g. `Leh24-2026-06`.
   *  Application-enforced uniqueness — code checks for an existing row
   *  before insert. Stable string (not a record link) so the row is
   *  identifiable in Airtable's URL bar. */
  contributionKey: "fld5vgc8uPzS3D1OC",
  /** Linked Members record. Despite the multipleRecordLinks type
   *  (Airtable's name for the underlying field), code treats this as
   *  a single-record link — exactly one Member per contribution. */
  member: "fldKGx8GF9NvZVJv4",
  /** Contribution month in `YYYY-MM` format (e.g. `2026-06`). The
   *  month this contribution applies to, NOT when it was paid. */
  period: "fld9SjijA21ggawwc",
  /** Lifecycle state — see CONTRIBUTION_STATUS for values. */
  status: "fldDeMFt8xSGCsmKW",
  /** What the contribution was supposed to be (ZAR). */
  amountExpected: "fld5WEu1E82NPOmXh",
  /** What actually came in (ZAR). May differ from expected for
   *  over/underpayments. Empty until Status=Paid. */
  amountReceived: "fldTpMqqIHhDMFdaC",
  /** Where the money came from — see CONTRIBUTION_SOURCE for values. */
  source: "fld1QhFn8dpmzvV4x",
  /** External payment identifier (Paystack ref, EFT ref, receipt number).
   *  Used for admin reconciliation against bank statements. */
  paymentReference: "fldevQ6zDpF2RZoz0",
  /** Date the money hit the trust account (ISO YYYY-MM-DD, SAST
   *  calendar date). Empty until Status=Paid. */
  paymentDate: "fld6u2P7x8Yp2D7ka",
  /** Plan tier at the time of contribution — Standard / Premium / Custom. */
  plan: "fldZrTkkJF3s5dKcF",
  /** Admin has independently verified this row against bank statement /
   *  Paystack dashboard. Gates the monthly close — only reconciled rows
   *  count toward "real" community pool totals. */
  reconciled: "fld7twUQVNz2KY0Xw",
  /** Email of the admin who reconciled. App-set, not free-text. */
  reconciledBy: "fldmMiICNnxITqYB3",
  /** Timestamp when reconciliation happened (Africa/Johannesburg). */
  reconciledAt: "fldT4TqQttgGqyL3j",
  /** Admin free-form notes (partial payment context, waiver reasons,
   *  follow-up reminders). */
  notes: "fld4cMZtEB8urU3vA",
  /** When the row was inserted (Africa/Johannesburg). App-set on insert.
   *  Distinct from Payment Date — a row exists from the moment the
   *  schedule is generated; payment lands later. */
  createdAt: "fldv6CUkhglxUqi1E",
  /** Last write timestamp (Africa/Johannesburg). App must update on
   *  every PATCH. Pairs with reconciledAt as the audit trail. */
  updatedAt: "fldoFUnyYgGeLORly",
} as const;

/**
 * Lifecycle states for a contribution row. Default on insert is `Pending`.
 *
 *   Pending    — expected but not yet paid.
 *   Paid       — money received & matched to the period.
 *   Failed     — Paystack/EFT attempt failed (member needs to retry).
 *   Refunded   — paid then returned (charge-back, error correction).
 *   Waived     — admin granted a free month (illness, hardship).
 */
export const CONTRIBUTION_STATUS = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
  waived: "Waived",
} as const;

export type ContributionStatus =
  (typeof CONTRIBUTION_STATUS)[keyof typeof CONTRIBUTION_STATUS];

/**
 * Airtable choice IDs for Contribution Status. Resolved via resolveSelect
 * when reading rows back with returnFieldsByFieldId=true.
 */
export const CONTRIBUTION_STATUS_CHOICE_ID_TO_NAME: Record<string, string> = {
  selO3FY0OQyRWKJBM: "Pending",
  selqtCdmKRWe1uzEv: "Paid",
  selv3vQn17lwZDold: "Failed",
  sel1BaovnHsJQ7Z3O: "Refunded",
  selspjsrfCtAxyNLx: "Waived",
};

/**
 * Where the money came from. Drives the Source column on the admin
 * reconciliation view.
 *
 *   Paystack       — automated card debit (default for the frictionless flow).
 *   EFT            — manual bank transfer initiated by member.
 *   Cash           — physical cash handover.
 *   Card (Manual)  — card payment captured outside the Paystack flow.
 *   Adjustment     — admin journal entry (correction).
 *   Waiver         — no money expected (paired with Status=Waived).
 */
export const CONTRIBUTION_SOURCE = {
  paystack: "Paystack",
  eft: "EFT",
  cash: "Cash",
  cardManual: "Card (Manual)",
  adjustment: "Adjustment",
  waiver: "Waiver",
} as const;

export type ContributionSource =
  (typeof CONTRIBUTION_SOURCE)[keyof typeof CONTRIBUTION_SOURCE];

export const CONTRIBUTION_SOURCE_CHOICE_ID_TO_NAME: Record<string, string> = {
  selUPbk3uFUptFBmp: "Paystack",
  sel8UD0sd688Q51CZ: "EFT",
  selJyjHx18Ff3B8Iy: "Cash",
  selHS6bPvCFHfsdDH: "Card (Manual)",
  selTxG90ta8Cd3nc9: "Adjustment",
  selzDpetuJGwlf5yR: "Waiver",
};

/** Lehumo plan tiers. Reflects the member's plan AT THE TIME of the
 *  contribution — members can switch plans across periods, so we keep
 *  this on the contribution row rather than only the member row. */
export const CONTRIBUTION_PLAN = {
  standard: "Standard",
  premium: "Premium",
  custom: "Custom",
} as const;

export type ContributionPlan =
  (typeof CONTRIBUTION_PLAN)[keyof typeof CONTRIBUTION_PLAN];

export const CONTRIBUTION_PLAN_CHOICE_ID_TO_NAME: Record<string, string> = {
  selxLc1xRmXQAvKOT: "Standard",
  selBRkz14qmSLxbdt: "Premium",
  selUdqH3ve7K7zVzF: "Custom",
};

/**
 * Resolved Contribution row as the app sees it (post-parseContribution).
 *
 * `member` is the Airtable record ID of the linked Members row, not the
 * full member object — call getMemberById separately if you need the
 * member's name/email/etc. This keeps the Contribution shape thin and
 * lets callers decide when to pay the round-trip cost of joining.
 */
export interface LehumoContribution {
  /** Airtable record ID of the contribution row. */
  id: string;
  /** Composite key — `{memberNumber}-{period}`, e.g. `Leh24-2026-06`. */
  contributionKey: string;
  /** Airtable record ID of the linked Members row. */
  memberId: string;
  /** YYYY-MM, the period this contribution applies to. */
  period: string;
  status: ContributionStatus;
  amountExpected: number | null;
  amountReceived: number | null;
  source: ContributionSource | null;
  paymentReference: string;
  /** YYYY-MM-DD, when money hit the trust account. */
  paymentDate: string | null;
  plan: ContributionPlan | null;
  reconciled: boolean;
  reconciledBy: string;
  /** ISO 8601 datetime in Africa/Johannesburg. */
  reconciledAt: string | null;
  notes: string;
  /** ISO 8601 datetime when the row was inserted. */
  createdAt: string | null;
  /** ISO 8601 datetime of the last write. */
  updatedAt: string | null;
}

/**
 * Generate the canonical contribution key for a (member, period) pair.
 *
 * Format: `{MemberNumber}-{YYYY-MM}`, e.g. `Leh24-2026-06`. The same key
 * shape is enforced as the primary field on the Contributions table so
 * duplicates surface immediately in Airtable's UI.
 */
export function buildContributionKey(
  memberNumber: number,
  period: string,
): string {
  return `${formatMemberNumber(memberNumber)}-${period}`;
}

/**
 * Validate a period string (YYYY-MM, 01-12). Helper for guarding API
 * boundaries — Zod schemas can wrap this. Returns the cleaned period
 * or null if invalid.
 */
export function parseContributionPeriod(value: string): string | null {
  const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return `${m[1]}-${m[2]}`;
}

/**
 * Generate the 60 contribution periods for a Lehumo membership.
 *
 * Lehumo collects from `start` (typically 1 Jun 2026) for `count`
 * consecutive months (typically 60 = 5 years). Returns periods as
 * `YYYY-MM` strings in chronological order — feed straight into
 * buildContributionKey or Airtable inserts.
 */
export function generateContributionPeriods(
  start: { year: number; month: number },
  count = 60,
): string[] {
  const periods: string[] = [];
  let { year, month } = start;
  for (let i = 0; i < count; i++) {
    periods.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return periods;
}

/**
 * Beneficiary relationship choices (Beneficiary Relationship singleSelect).
 * Order intentionally mirrors the most common SA next-of-kin patterns so the
 * portal dropdown surfaces the likely match first.
 */
export const RELATIONSHIP_CHOICE_ID_TO_NAME: Record<string, string> = {
  seln7J3Rls77mXfFw: "Spouse",
  sely6Sl0pBjkq279a: "Partner",
  selB10SunMjn7P7zk: "Parent",
  selWixrWPyQEUv80B: "Child",
  seldrIL1yRizkZ4g8: "Sibling",
  sel6Uwal9nKcWk0DM: "Other Family",
  selRnx45Gfk00Sye7: "Friend",
  selfxOhOwXKgcxVww: "Other",
};

export const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Partner",
  "Parent",
  "Child",
  "Sibling",
  "Other Family",
  "Friend",
  "Other",
] as const;
export type BeneficiaryRelationship = (typeof RELATIONSHIP_OPTIONS)[number];

/**
 * Active loan type — tells us which lending track funded this draw.
 *
 * - "Self": member is borrowing against their own 20% allowance. Always
 *   interest-free; max draw = min(contributed × 20%, R20,000).
 * - "P2P":  another member fronts the difference above the 20% cap. Interest
 *   is set by the lending member within group-agreed guidelines, and any
 *   unpaid principal + interest is clawed back from the borrower's
 *   contributions before capital is deployed at year 5 (per the 21 April
 *   investor session).
 *
 * The Lending Pledges marketplace (members posting offers + others
 * expressing interest) is the next-session deliverable; for now P2P loans
 * land via committee facilitation and are recorded with type = "P2P".
 */
export const LOAN_TYPE_CHOICE_ID_TO_NAME: Record<string, string> = {
  selbSSFgbMHGTGCsN: "Self",
  selrDOnkP1cPtpkrT: "P2P",
};

export const ACTIVE_LOAN_TYPES = ["Self", "P2P"] as const;
export type ActiveLoanType = (typeof ACTIVE_LOAN_TYPES)[number];

/**
 * Convert the wizard's internal id-type code to the human-readable name
 * expected by Airtable's singleSelect choices ("SA ID" / "Passport").
 */
export function idTypeToAirtable(value: "sa_id" | "passport"): "SA ID" | "Passport" {
  return value === "sa_id" ? "SA ID" : "Passport";
}

// ─── TypeScript Types ───────────────────────────────────────────────
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];
export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

// ─── Member Number Format ───────────────────────────────────────────
/** Prefix used when displaying member numbers (e.g. "Leh01"). */
export const MEMBER_NUMBER_PREFIX = "Leh";

/**
 * Format a raw member number for display: 1 -> "Leh01", 30 -> "Leh30",
 * 100 -> "Leh100" (pads to at least 2 digits).
 */
export function formatMemberNumber(n: number | string): string {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num) || num <= 0) return String(n ?? "");
  return `${MEMBER_NUMBER_PREFIX}${String(Math.trunc(num)).padStart(2, "0")}`;
}

/**
 * Build the EFT deposit reference a member should use on a manual bank
 * transfer. Format: `Leh{NN} {Initial}.{Surname}` — e.g. `Leh01 M.Tsomele`.
 *
 * Locked to a single canonical format so admin recon can grep the bank
 * statement reliably. If the name only has one part we drop the initial
 * (e.g. `Leh22 Bontle`); if the input is empty we fall back to just the
 * member number prefix so the reference is never blank.
 *
 * The space + dot in `M.Tsomele` reads cleanly on a bank statement and
 * survives most banks' character filters — the alternatives (`M_Tsomele`,
 * `MTsomele`, `Leh01-M-Tsomele`) either look odd or risk being mangled.
 */
export function formatEftReference(
  memberNumber: number | string,
  fullName: string,
): string {
  const prefix = formatMemberNumber(memberNumber);
  const parts = (fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return prefix;
  if (parts.length === 1) return `${prefix} ${parts[0]}`;
  const initial = parts[0][0]?.toUpperCase() ?? "";
  const surname = parts[parts.length - 1];
  return initial ? `${prefix} ${initial}.${surname}` : `${prefix} ${surname}`;
}

/**
 * Parse any supported member number input to its underlying positive integer.
 * Accepts "Leh01", "leh 1", "LEH7", "07", "7", etc. Returns null if the input
 * cannot be resolved to a positive integer.
 */
export function parseMemberNumber(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 ? Math.trunc(raw) : null;
  }
  const digits = raw.toString().replace(/[^0-9]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Shape of an Airtable attachment cell value. We only consume the fields
 * we actually render or link to in the UI (url, filename, type, size,
 * thumbnails for image previews); Airtable returns more.
 */
export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size?: number;
  type?: string; // mime type, e.g. "image/jpeg" or "application/pdf"
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

export interface LehumoMember {
  id: string; // Airtable record ID
  fullName: string;
  memberNumber: number;
  email: string;
  phone: string;
  status: MemberStatus;
  kycStatus: KycStatus;
  source: string;
  notes: string;
  contributions: Record<string, boolean>; // { Jan: true, Feb: false, ... }
  /**
   * Full contribution history from the new Contributions linked table —
   * 60 rows per member spanning Jun 2026 → May 2031, each carrying
   * payment metadata (amount, source, ref, reconciliation state).
   *
   * Populated by `hydrateContributionsFromNewTable` when
   * `LEHUMO_USE_NEW_CONTRIBUTIONS` is on. Components use this for
   * year-spanning UI (5-year roadmap, full payment history) — when
   * undefined (flag off, or fetch failed), components fall back to
   * the projected 12-month `contributions` shape above.
   *
   * Sorted ascending by Period for stable rendering.
   */
  contributionRows?: LehumoContribution[];
  // ── KYC / identity (optional — populated post-Tier 2A onboarding) ──
  idType?: "SA ID" | "Passport" | "";
  idNumber?: string;
  residentialAddress?: string;
  kycIdDocument?: AirtableAttachment[];
  kycProofOfAddress?: AirtableAttachment[];
  kycSubmittedAt?: string; // YYYY-MM-DD (Airtable date-only field)
  kycVerifiedAt?: string; // YYYY-MM-DD (Airtable date-only field)
  // ── Next-of-kin / beneficiary (optional — captured post-onboarding) ──
  beneficiaryFirstName?: string;
  beneficiarySurname?: string;
  beneficiaryRelationship?: BeneficiaryRelationship | "";
  beneficiaryPhone?: string;
  beneficiaryEmail?: string;
  beneficiaryAddress?: string;
  beneficiaryUpdatedAt?: string; // YYYY-MM-DD (Airtable date-only field)
  // ── Active loan (optional — populated when a member draws on their 20%
  //    allowance or receives a P2P advance). One active loan at a time. ──
  activeLoanBalance?: number;
  activeLoanIssuedAt?: string; // YYYY-MM-DD (Airtable date-only field)
  activeLoanType?: ActiveLoanType | "";
  // ── Plan tier captured during onboarding Step 2 (basic / standard / vip).
  //    Stored in the notes blob as "Plan: <tier>" pending a dedicated
  //    Airtable column; parseRecord extracts it on read so portal + admin
  //    UI can display the chosen tier and the SetUpPaymentsCard can route
  //    to the correct payment ceremony (manual EFT for basic, Paystack
  //    debit-order for standard, hold for VIP).
  plan?: MemberPlan;
  // ── Paystack subscription state. Captured from the
  //    `subscription.create` webhook event (sets `subscriptionCode`) and
  //    cleared on `subscription.disable`. When a member downgrades from
  //    Standard → Basic and we successfully cancel via the Paystack API,
  //    code is cleared and action is null. If the API call fails or no
  //    code is stored, `subscriptionAction` is set to `"Cancel Pending"`
  //    so the admin panel can surface it before the next billing cycle.
  //    Both stored as segments in the same `notes` blob as Plan.
  subscriptionCode?: string | null;
  subscriptionAction?: SubscriptionAction | null;
  // ── Steering Committee volunteer submission. Null until the member
  //    opts in via the portal's SteeringCommitteeCard; populated with
  //    expertise + optional motivation + ISO submitted-at stamp once
  //    they hit Apply. Same notes-blob pattern as Plan / SubCode.
  steering?: SteeringSubmission | null;
}

/**
 * Plan tiers a member chooses during Step 2 of onboarding. Distinct from
 * the Contributions-table `ContributionPlan` enum (Standard/Premium/
 * Custom) — those are per-row admin classifications. This is the
 * member's standing tier:
 *   - `basic`   — R1,000/month, manual EFT
 *   - `standard`— R1,035/month (R1,000 + 3.5% service fee), Paystack debit order
 *   - `vip`     — R1,050/month (R1,000 + 5% service fee), Paystack + inner-circle perks
 */
export type MemberPlan = "basic" | "standard" | "vip";

/**
 * Pull the member's plan tier out of the free-text `notes` field. Notes
 * are stored as pipe-delimited segments by the onboard route, e.g.:
 *   "Intent: Ready to join | Commitment: R1 000 | Plan: standard | Source of Funds: Salary"
 *
 * We pluck the `Plan: <tier>` segment and validate it against the
 * MemberPlan enum so a typo or stale value falls through to undefined
 * rather than rendering "Plan: garble" in the UI. Used by both
 * parseRecord variants (member + admin) so portal + admin surfaces
 * see the same canonical plan.
 */
export function extractPlanFromNotes(notes: string): MemberPlan | undefined {
  if (!notes) return undefined;
  const match = /(?:^|\|)\s*Plan:\s*([a-z]+)/i.exec(notes);
  if (!match) return undefined;
  const candidate = match[1].toLowerCase();
  if (candidate === "basic" || candidate === "standard" || candidate === "vip") {
    return candidate;
  }
  return undefined;
}

/**
 * Subscription-related state stored inside the same pipe-delimited
 * `notes` blob used for Plan / Commitment / Intent. Living here
 * avoids an Airtable schema change while still giving us structured,
 * machine-parseable data the admin pending-actions surface can filter
 * on.
 *
 * Segment shape:
 *   `SubCode: SUB_xxxxxxxx` — Paystack recurring-subscription
 *     identifier captured from the `subscription.create` webhook event.
 *     Cleared when the subscription is disabled.
 *   `SubAction: Cancel Pending` — set when a member downgrades from
 *     Standard → Basic but we couldn't auto-cancel their Paystack
 *     subscription (no code stored, or the disable API call failed).
 *     Cleared by the auto-cancel path on success, or by an admin
 *     manually marking the row resolved.
 */
export type SubscriptionAction = "Cancel Pending";

export interface SubscriptionState {
  /** Paystack subscription code (SUB_xxx) if we know it. */
  code: string | null;
  /** Open admin action against this member's subscription, if any. */
  action: SubscriptionAction | null;
}

/**
 * Steering Committee volunteer submission. Members opt in via the
 * portal's SteeringCommitteeCard and the data lands in the same
 * pipe-delimited `notes` blob as Plan / SubCode etc.:
 *   `SteeringExpertise: <text>` (required)
 *   `SteeringMotivation: <text>` (optional)
 *   `SteeringSubmittedAt: <ISO date>` (server-stamped)
 *
 * Pipe characters in user input are stripped before write to keep the
 * segment delimiter intact.
 */
export interface SteeringSubmission {
  expertise: string;
  motivation: string;
  submittedAt: string; // ISO date YYYY-MM-DD
}

export function extractSteeringFromNotes(
  notes: string,
): SteeringSubmission | null {
  if (!notes) return null;
  const expertise = /(?:^|\|)\s*SteeringExpertise:\s*([^|]+)/i.exec(notes);
  if (!expertise) return null;
  const motivation = /(?:^|\|)\s*SteeringMotivation:\s*([^|]+)/i.exec(notes);
  const submittedAt = /(?:^|\|)\s*SteeringSubmittedAt:\s*([^|]+)/i.exec(notes);
  return {
    expertise: expertise[1].trim(),
    motivation: motivation ? motivation[1].trim() : "",
    submittedAt: submittedAt ? submittedAt[1].trim() : "",
  };
}

export function spliceSteeringIntoNotes(
  existingNotes: string,
  patch: { expertise: string; motivation?: string; submittedAt: string } | null,
): string {
  const segments = (existingNotes ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  // Strip any existing Steering segments before re-appending (handles
  // both first-write and edit-after-submit cleanly).
  const keep = segments.filter(
    (s) => !/^Steering(Expertise|Motivation|SubmittedAt):/i.test(s),
  );
  if (patch) {
    // Sanitise: strip `|` from user input so the segment delimiter
    // can't be injected by a copy-paste of pipe characters.
    const safe = (s: string) => s.replace(/\|/g, "/").trim();
    keep.push(`SteeringExpertise: ${safe(patch.expertise)}`);
    if (patch.motivation && patch.motivation.trim()) {
      keep.push(`SteeringMotivation: ${safe(patch.motivation)}`);
    }
    keep.push(`SteeringSubmittedAt: ${patch.submittedAt}`);
  }
  return keep.join(" | ");
}

const EMPTY_SUBSCRIPTION_STATE: SubscriptionState = { code: null, action: null };

export function extractSubscriptionFromNotes(notes: string): SubscriptionState {
  if (!notes) return { ...EMPTY_SUBSCRIPTION_STATE };
  const codeMatch = /(?:^|\|)\s*SubCode:\s*([A-Za-z0-9_-]+)/i.exec(notes);
  const actionMatch = /(?:^|\|)\s*SubAction:\s*([^|]+)/i.exec(notes);
  const code = codeMatch ? codeMatch[1].trim() : null;
  const rawAction = actionMatch ? actionMatch[1].trim() : null;
  // Whitelist the action vocabulary so a stale or typo'd value doesn't
  // light up the admin dashboard incorrectly.
  const action: SubscriptionAction | null =
    rawAction === "Cancel Pending" ? rawAction : null;
  return { code, action };
}

/**
 * Splice subscription segments back into the notes blob. Pass `null` for
 * either field to remove it. Preserves every other segment (Plan,
 * Commitment, Intent, etc.) so this is safe to call from the webhook,
 * the plan-switch API, and admin "mark resolved" actions alike.
 */
export function spliceSubscriptionIntoNotes(
  existingNotes: string,
  patch: { code?: string | null; action?: SubscriptionAction | null },
): string {
  const segments = (existingNotes ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const updateOrRemove = (
    prefixRe: RegExp,
    prefix: string,
    value: string | null | undefined,
  ) => {
    // Drop any existing matching segment(s) — there should only be one
    // but a stale duplicate shouldn't break the rewrite.
    for (let i = segments.length - 1; i >= 0; i--) {
      if (prefixRe.test(segments[i])) segments.splice(i, 1);
    }
    if (value !== undefined && value !== null && value !== "") {
      segments.push(`${prefix}: ${value}`);
    }
  };

  if (patch.code !== undefined) {
    updateOrRemove(/^SubCode:\s*/i, "SubCode", patch.code);
  }
  if (patch.action !== undefined) {
    updateOrRemove(/^SubAction:\s*/i, "SubAction", patch.action);
  }

  return segments.join(" | ");
}

/**
 * Today's date as `YYYY-MM-DD` (UTC).
 *
 * The Airtable `KYC Submitted At` and `KYC Verified At` columns are
 * configured as date-only fields, so they reject full ISO timestamps
 * with `INVALID_VALUE_FOR_COLUMN`. Use this helper anywhere we stamp
 * those columns server-side.
 *
 * Anchored to UTC so the value is stable regardless of where the
 * Vercel function happens to execute. The display layer can format
 * for the viewer's locale.
 */
export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Current SAST (Africa/Johannesburg) month + days left.
 *
 * Used by the member-portal contribution reminder card so it shows the
 * right month even when the function happens to run just before/after
 * UTC midnight. Vercel runs in UTC; SA is UTC+2, so a naive
 * `new Date().getMonth()` can be off by one for the last/first two
 * hours of the month.
 *
 * Returns the three-letter month code (matching MONTH_NAMES) and the
 * count of days remaining including today (1 = today is the last day
 * of the month).
 */
export function getSastMonthInfo(now: Date = new Date()): {
  monthCode: string;
  daysLeftInMonth: number;
} {
  // en-CA gives YYYY-MM-DD which is trivial to slice. timeZone option
  // is what makes this SAST instead of UTC.
  const sastYmd = now.toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  const [yearStr, monthStr, dayStr] = sastYmd.split("-");
  const year = Number(yearStr);
  const monthIdx = Number(monthStr) - 1; // 0-11
  const day = Number(dayStr);

  const monthCode = MONTH_NAMES[monthIdx] ?? "Jan";

  // Day 0 of next month = last day of current month.
  const lastDay = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
  const daysLeftInMonth = Math.max(1, lastDay - day + 1);

  return { monthCode, daysLeftInMonth };
}

/**
 * Whether a member has a beneficiary on file.
 *
 * Single source of truth for the "is the next-of-kin captured?" check —
 * used by the member-portal BeneficiaryCard, the admin members table
 * (Beneficiary column / Missing-only filter / stat tile), and the
 * dashboard completeness meter.
 *
 * Definition: both name fields populated. The Zod schema
 * (BeneficiaryFormSchema) enforces relationship + at-least-one-contact
 * before a row can be written, so name presence is sufficient — if the
 * names are there, the rest came in through the same validated form.
 */
export function hasBeneficiary(member: LehumoMember): boolean {
  return Boolean(
    member.beneficiaryFirstName?.trim() && member.beneficiarySurname?.trim(),
  );
}

// ─── Emergency Access (member loans against own contributions) ─────
/**
 * Months of contributions a member must have on record before any of
 * their 20% becomes accessible. Per the 21 April investor session this
 * is uniform across all plan tiers — six months in, regardless of
 * which monthly amount they're contributing.
 */
export const EMERGENCY_ACCESS_TENURE_MONTHS = 6;
/** % of cumulative contributions a member can borrow against, interest-free. */
export const EMERGENCY_ACCESS_PCT = 0.2;
/** Hard ceiling on a self-loan, in ZAR — kicks in at R100k contributed. */
export const EMERGENCY_ACCESS_CAP_ZAR = 20_000;
/** Days from issue until repayment is due. Past this, the loan is overdue. */
export const EMERGENCY_ACCESS_TERM_DAYS = 90;
/**
 * Default monthly contribution rate used to translate ticked months
 * into a ZAR balance. This is an approximation: per Cost.tsx, plans
 * range R500 / R1,000 / R2,000 (Basic / Standard / VIP) and `plan` is
 * not yet a first-class column on `LehumoMember` (it rides along in
 * `notes` from the onboarding form). Until plan becomes a real field,
 * we treat everyone as standard-tier — under-counts Basic members,
 * over-counts VIP. Same assumption already lives in admin-stats.ts.
 */
export const EMERGENCY_ACCESS_MONTHLY_ZAR = 1000;

/**
 * Discriminated state describing a member's emergency-access status.
 *
 *  - `locked`      → still inside the 6-month tenure window
 *  - `available`   → eligible, no active loan; `availableZAR` is what
 *                    they can draw right now
 *  - `active-loan` → already drawn; balance + due date populated, plus
 *                    `remainingHeadroomZAR` if they're still under cap
 */
export type EmergencyAccessState =
  | {
      kind: "locked";
      monthsContributed: number;
      monthsRemaining: number;
      /** The most this member could ever access at end-of-trust given
       *  their full 60-period schedule —
       *  `min(0.2 × lifetimeGoal, EMERGENCY_ACCESS_CAP_ZAR)`.
       *  R12,000 for a Standard plan member; rises toward the R20,000
       *  ceiling for Premium / Custom tiers. Used by EmergencyAccessCard
       *  as the anchor for its R-progress bar. */
      maxPossibleZAR: number;
    }
  | {
      kind: "available";
      monthsContributed: number;
      contributedZAR: number;
      maxAvailableZAR: number; // min(contributed × 20%, R20k)
      maxPossibleZAR: number; // see locked state
      availableZAR: number; // maxAvailableZAR (no active draw to subtract)
      capReason: "percent" | "ceiling";
    }
  | {
      kind: "active-loan";
      monthsContributed: number;
      contributedZAR: number;
      maxAvailableZAR: number;
      maxPossibleZAR: number; // see locked state
      activeBalanceZAR: number;
      issuedAt: string; // YYYY-MM-DD
      dueAt: string; // YYYY-MM-DD = issuedAt + 90d
      isOverdue: boolean;
      loanType: ActiveLoanType;
      remainingHeadroomZAR: number; // additional Self draw still available before hitting the 20% cap
    };

/**
 * Compute a member's emergency-access state from their contributions
 * + active-loan ledger fields.
 *
 * Business rules (per Cost.tsx + the 21 April investor session):
 *   1. 6-month minimum tenure — no draws until the member has paid 6 months.
 *   2. 20% cap with R20,000 ceiling — max self-loan = min(contributed × 20%, 20_000).
 *   3. Interest-free within the 20%; P2P only kicks in above the cap.
 *   4. 90-day repayment window from issue date.
 *   5. One active loan at a time — represented as scalar fields on the
 *      member record (no separate Loans table for v1).
 *
 * `today` is injectable so server components / tests can pin a date.
 */
export function computeEmergencyAccess(
  member: LehumoMember,
  today: Date = new Date(),
): EmergencyAccessState {
  // ── Source of truth for monthsContributed + contributedZAR ──
  // When the rich Contributions-table shape is hydrated on the member
  // (Phase 3+, flag on), use it for lifetime-accurate counts:
  //   - monthsContributed counts ALL Paid rows across the 5-year trust,
  //     not just the SAST-current calendar year that the legacy 12-key
  //     projection captures (which would silently zero out members'
  //     year-1 history once we cross into 2027).
  //   - contributedZAR sums actual `amountReceived` (plan-aware —
  //     Premium = R2,000), not monthsContributed × R1,000.
  // Falls back to the legacy projection × R1,000 when contributionRows
  // is undefined (flag off, pre-cutover, or fetch failure).
  let monthsContributed: number;
  let contributedZAR: number;
  let lifetimeGoalZAR: number;

  if (member.contributionRows && member.contributionRows.length > 0) {
    const paidRows = member.contributionRows.filter(
      (r) => r.status === CONTRIBUTION_STATUS.paid,
    );
    monthsContributed = paidRows.length;
    contributedZAR = paidRows.reduce(
      (sum, r) => sum + (r.amountReceived ?? 0),
      0,
    );
    lifetimeGoalZAR = member.contributionRows.reduce(
      (sum, r) => sum + (r.amountExpected ?? 0),
      0,
    );
  } else {
    monthsContributed = Object.values(member.contributions).filter(
      Boolean,
    ).length;
    contributedZAR = monthsContributed * EMERGENCY_ACCESS_MONTHLY_ZAR;
    // 60 months × R1,000 standard plan — proxy for the legacy-only path.
    // Real plan tiers come through via contributionRows above.
    lifetimeGoalZAR = 60 * EMERGENCY_ACCESS_MONTHLY_ZAR;
  }

  // The most this member could ever access at end-of-trust — anchor for
  // the EmergencyAccessCard's R-progress bar. For a Standard plan
  // member this is R12,000 (= 0.2 × R60k); higher-tier plans rise
  // toward the R20,000 system ceiling.
  const maxPossibleZAR = Math.min(
    Math.floor(lifetimeGoalZAR * EMERGENCY_ACCESS_PCT),
    EMERGENCY_ACCESS_CAP_ZAR,
  );

  if (monthsContributed < EMERGENCY_ACCESS_TENURE_MONTHS) {
    return {
      kind: "locked",
      monthsContributed,
      monthsRemaining: EMERGENCY_ACCESS_TENURE_MONTHS - monthsContributed,
      maxPossibleZAR,
    };
  }

  const percentCap = Math.floor(contributedZAR * EMERGENCY_ACCESS_PCT);
  const maxAvailableZAR = Math.min(percentCap, EMERGENCY_ACCESS_CAP_ZAR);
  const capReason: "percent" | "ceiling" =
    percentCap < EMERGENCY_ACCESS_CAP_ZAR ? "percent" : "ceiling";

  const activeBalance = Math.max(0, member.activeLoanBalance ?? 0);

  if (activeBalance > 0 && member.activeLoanIssuedAt) {
    const issued = new Date(member.activeLoanIssuedAt);
    const due = new Date(issued);
    due.setDate(due.getDate() + EMERGENCY_ACCESS_TERM_DAYS);
    return {
      kind: "active-loan",
      monthsContributed,
      contributedZAR,
      maxAvailableZAR,
      maxPossibleZAR,
      activeBalanceZAR: activeBalance,
      issuedAt: member.activeLoanIssuedAt,
      dueAt: due.toISOString().slice(0, 10),
      isOverdue: today > due,
      loanType: (member.activeLoanType || "Self") as ActiveLoanType,
      remainingHeadroomZAR: Math.max(0, maxAvailableZAR - activeBalance),
    };
  }

  return {
    kind: "available",
    monthsContributed,
    contributedZAR,
    maxAvailableZAR,
    maxPossibleZAR,
    availableZAR: maxAvailableZAR,
    capReason,
  };
}

/** One month in the cumulative pool timeline. */
export interface PoolMonthPoint {
  month: string; // e.g. "Jan"
  contributorsThisMonth: number; // number of members with that month checked
  contributedThisMonth: number; // R amount contributed in that month
  cumulativeContributed: number; // running R balance through this month
  cumulativeInterest: number; // running R interest through this month
  cumulativeBalance: number; // contributed + interest (running)
}

/** Aggregate pool-wide stats for the member dashboard. */
export interface CommunityPoolStats {
  totalFoundingSlots: number; // 30
  activeMembers: number; // members with Status = Active
  membersContributedEver: number; // distinct members with >=1 checked month
  membersContributingThisMonth: number; // contributors in current calendar month
  totalContributed: number; // R amount across all members, all months
  totalInterest: number; // cumulative interest earned (manual / env)
  totalPool: number; // totalContributed + totalInterest
  currentMonth: string; // e.g. "Apr"
  timeline: PoolMonthPoint[]; // 12-month cumulative series
}

export interface SessionPayload {
  memberId: string; // Airtable record ID
  email: string;
  memberNumber: number;
  fullName: string;
  exp: number;
}

// ─── Zod Schemas ────────────────────────────────────────────────────
export const LoginFormSchema = z.object({
  email: emailField,
  memberNumber: z
    .union([z.string(), z.number()])
    .transform((v) => parseMemberNumber(v))
    .refine((v): v is number => v !== null, {
      message: "Please enter a valid member number (e.g. Leh01)",
    }),
});

export const OnboardingFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: emailField,
  phone: z.string().min(10, "Please enter a valid phone number"),
  source: z.enum(["Google", "Instagram", "Referral", "WhatsApp", "Direct"]),
  intent: z.string().optional(),
  commitment: z.string().optional(),
  plan: z.enum(["basic", "standard", "vip"]).optional(),
  sourceOfFunds: z.string().optional(),
  /** "sa_id" or "passport" — captured on Step 3 of the wizard. */
  idType: z.enum(["sa_id", "passport"]).optional(),
  /** Raw ID/passport number captured on Step 3 (already validated
   *  client-side; stored as-is for now). */
  idNumber: z.string().optional(),
  /** Free-form residential address captured on Step 3. */
  residentialAddress: z.string().optional(),
});

export const PaystackInitSchema = z.object({
  email: emailField,
  memberRecordId: z.string().startsWith("rec"),
  plan: z.enum(["basic", "standard", "vip"]).optional(),
  /**
   * Where Paystack should bounce the user back to after checkout. The
   * onboarding wizard's StepPayment defaults to "onboard" (which lands
   * on `/lehumo/onboard?step=confirm` so the wizard's Confirmation step
   * picks up the reference and finishes the flow). The portal's
   * SetUpPaymentsCard / PaymentCard pass "portal" so an existing member
   * who's just configured their card lands back inside the dashboard
   * with a success banner — not bounced out to the public onboarding
   * wizard. Defaults to "onboard" for backwards compatibility.
   */
  returnTo: z.enum(["onboard", "portal"]).optional(),
});

/**
 * Beneficiary update payload (member portal).
 *
 * Name + Surname + Relationship are required so a record always has enough
 * to identify the next-of-kin. Phone, Email, and Address are individually
 * optional, but the API enforces that **at least one** of them is present —
 * that's the actual contactability requirement we promised in the FAQ.
 *
 * Empty-string trims are deliberate: HTML inputs default to "" and we want
 * those treated as "not provided" rather than valid-but-empty values.
 */
export const BeneficiaryFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(100, "First name is too long"),
    surname: z
      .string()
      .trim()
      .min(1, "Surname is required")
      .max(100, "Surname is too long"),
    relationship: z.enum(RELATIONSHIP_OPTIONS, {
      message: "Pick a relationship",
    }),
    phone: z
      .string()
      .trim()
      .max(40, "Phone is too long")
      .optional()
      .or(z.literal("")),
    email: optionalEmailField.or(z.literal("")),
    address: z
      .string()
      .trim()
      .max(500, "Address is too long")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      Boolean((data.phone ?? "").trim()) ||
      Boolean((data.email ?? "").trim()) ||
      Boolean((data.address ?? "").trim()),
    {
      message: "Provide at least one of phone, email, or address",
      path: ["phone"],
    },
  );

export type BeneficiaryFormData = z.infer<typeof BeneficiaryFormSchema>;

export type LoginFormData = z.infer<typeof LoginFormSchema>;
export type OnboardingFormData = z.infer<typeof OnboardingFormSchema>;
