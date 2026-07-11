"use server";

import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import {
  adminUpdateMember,
  logEftPayment as logEftPaymentAdmin,
  reallocateContribution as reallocateContributionAdmin,
  setMonthPayment,
  voidContribution as voidContributionAdmin,
} from "@/lib/airtable-admin";
import { disableSubscription } from "@/lib/paystack";
import type { EftAllocationPlan } from "@/lib/eft-allocation";
import {
  splicePasswordHashIntoNotes,
  spliceSubscriptionIntoNotes,
} from "@/lib/definitions";
import {
  createMember,
  findMemberByEmail,
  getMemberById,
  getNextMemberNumber,
  setMemberBeneficiary,
  updateMember,
} from "@/lib/airtable";
import {
  sendContributionReceiptEmail,
  sendKycVerifiedEmail,
  sendWelcomeEmail,
} from "@/lib/email";
import {
  AIRTABLE_FIELDS,
  MONTH_NAMES,
  MEMBER_STATUS,
  KYC_STATUS,
  CONTRIBUTION_STATUS,
  BeneficiaryFormSchema,
  CONTRIBUTION_SOURCE,
  FundPortfolioSchema,
  FundInterestSchema,
  emailField,
  formatMemberNumber,
  todayDate,
  type ContributionSource,
  type ContributionStatus,
  type FundPortfolio,
  type FundPortfolioInput,
  type FundInterestInput,
  type LehumoContribution,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
  type BeneficiaryFormData,
} from "@/lib/definitions";
import { upsertFundInterest, upsertFundPortfolio } from "@/lib/fund-settings";
import {
  ensureCanonicalMemberSchedule,
  getContributionById,
  reassignContribution,
  reconcileContribution,
  updateContribution,
} from "@/lib/contributions";

const StatusValues = Object.values(MEMBER_STATUS) as [string, ...string[]];
const KycValues = Object.values(KYC_STATUS) as [string, ...string[]];
const MonthNamesTuple = MONTH_NAMES as [string, ...string[]];

const IdSchema = z.string().startsWith("rec");

export type AdminActionResult =
  | { ok: true; member: LehumoMember }
  | { ok: false; error: string };

async function requireAdmin(): Promise<{ ok: true } | AdminActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Forbidden" };
  return { ok: true };
}

/**
 * Toggle a single month's paid state for one member. Called from the
 * admin member table row by row — the client updates local state
 * optimistically from the returned member record.
 */
/**
 * Log a manual EFT payment against a member. The amount is auto-allocated
 * across one-or-more contribution rows (oldest unpaid first); a R2,000
 * payment will land as "Jun 2026 paid + Jul 2026 paid", a R1,500 as
 * "Jun 2026 paid + Jul 2026 partial (R500)", etc.
 *
 * Returns both the freshly-refetched member AND the allocation plan
 * (which rows got what amount, what status, any unallocated remainder)
 * so the admin UI can show a clear confirmation: "R2,000 applied to
 * Jun 2026 + Jul 2026".
 */
const LogEftSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(100_000, "Amount looks unusually large — confirm with the bank first"),
  paymentReference: z
    .string()
    .min(1, "Reference is required")
    .max(200, "Reference is too long"),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  notes: z.string().max(500).optional(),
  /** Pin the deposit to a specific contribution month (`YYYY-MM`) rather
   *  than the oldest-unpaid auto-walk. */
  targetPeriod: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Period must be YYYY-MM")
    .optional(),
});

export type LogEftPaymentResult =
  | { ok: true; member: LehumoMember; plan: EftAllocationPlan }
  | { ok: false; error: string };

export async function logEftPayment(
  recordId: string,
  input: {
    amount: number;
    paymentReference: string;
    paymentDate?: string;
    notes?: string;
    targetPeriod?: string;
  },
): Promise<LogEftPaymentResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as LogEftPaymentResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  const parsed = LogEftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const { plan, member } = await logEftPaymentAdmin({
      memberRecordId: recordId,
      amount: parsed.data.amount,
      paymentReference: parsed.data.paymentReference,
      paymentDate: parsed.data.paymentDate,
      notes: parsed.data.notes,
      targetPeriod: parsed.data.targetPeriod,
    });

    // Fire-and-forget receipt email — same template the Paystack
    // webhook uses for ongoing contributions. Multi-month EFTs
    // (e.g. R3,000 covering 3 months) collapse into a single
    // combined-period label like "Jun + Jul + Aug 2026" so the
    // member gets one receipt for the whole deposit, not three.
    //
    // The mail call doesn't block the response — failure here
    // (Resend down, transient API hiccup) is logged but doesn't
    // unwind the contribution write, which is already persisted
    // by the time we get here. The admin sees success either
    // way, and we can resend manually from Resend's dashboard if
    // needed.
    if (member.email && plan.rows.length > 0 && plan.totalApplied > 0) {
      const periodLabel = buildMultiPeriodLabel(plan.rows.map((r) => r.period));
      sendContributionReceiptEmail({
        to: member.email,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
        amountZar: plan.totalApplied,
        monthLabel: periodLabel,
        paymentReference: parsed.data.paymentReference,
      }).catch((err) => {
        console.error("sendContributionReceiptEmail (EFT) failed:", err);
      });
    }

    return { ok: true, member, plan };
  } catch (err) {
    console.error("logEftPayment error:", err);
    const msg =
      err instanceof Error
        ? err.message
        : "Failed to log EFT payment — please retry";
    return { ok: false, error: msg };
  }
}

/**
 * Resolve a pending "Cancel subscription" action against a member.
 *
 * Two paths:
 *   - `mode: "retry"` — re-attempts the Paystack disable using the
 *     stored subscription_code. Used when the original auto-cancel
 *     failed (network blip, code stale). On success we clear both the
 *     code and the action flag; on failure we keep the flag set with
 *     an error message in the response.
 *   - `mode: "mark-done"` — admin has cancelled the subscription
 *     manually on the Paystack dashboard and is acknowledging the
 *     action is complete. Clears the flag without calling Paystack
 *     (so we don't error if the code is genuinely gone). Use when:
 *     legacy member with no stored code, or Paystack-dashboard-only
 *     cleanup that didn't fire a `subscription.disable` webhook.
 *
 * Both paths preserve every other notes segment (Plan, Commitment,
 * Intent, etc.) via spliceSubscriptionIntoNotes.
 */
export type ResolveSubscriptionResult =
  | { ok: true; member: LehumoMember; mode: "retry" | "mark-done" }
  | { ok: false; error: string };

export async function resolveSubscriptionCancel(
  recordId: string,
  mode: "retry" | "mark-done",
): Promise<ResolveSubscriptionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as ResolveSubscriptionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  try {
    const member = await getMemberById(recordId);
    if (!member) return { ok: false, error: "Member not found" };

    let patch: { code?: string | null; action?: "Cancel Pending" | null };

    if (mode === "retry") {
      const code = member.subscriptionCode;
      if (!code) {
        return {
          ok: false,
          error:
            "No subscription code stored — use 'Mark as resolved' instead, or cancel directly on the Paystack dashboard.",
        };
      }
      const result = await disableSubscription(code);
      if (!result.ok) {
        return {
          ok: false,
          error: `Paystack disable failed: ${result.error}. Try again, or cancel on the Paystack dashboard and use 'Mark as resolved'.`,
        };
      }
      patch = { code: null, action: null };
    } else {
      // mark-done — clear the flag, leave the code untouched (so the
      // history of what subscription was active stays inspectable).
      patch = { action: null };
    }

    const newNotes = spliceSubscriptionIntoNotes(member.notes ?? "", patch);
    await updateMember(recordId, {
      [AIRTABLE_FIELDS.notes]: newNotes,
    });

    const updated = await getMemberById(recordId);
    if (!updated) throw new Error("Member disappeared after update");
    return { ok: true, member: updated, mode };
  } catch (err) {
    console.error("resolveSubscriptionCancel error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to resolve",
    };
  }
}

/**
 * Admin escape-hatch: clear a member's optional portal password.
 *
 * The reset flow ("Forgot password" magic link) covers 99% of cases on
 * its own — but it requires the member to access their registered
 * email AND remember their member number. If they've lost both (e.g.
 * email account hacked, or they joined under a defunct work address),
 * the only way out is admin intervention.
 *
 * This action wipes the `PwHash:` segment from the member's notes
 * blob, returning them to the legacy email + member-number sign-in
 * path. They can set a new password from /lehumo/portal/security
 * once they're back in.
 *
 * No email is sent to the member: admin should always do this from a
 * support conversation where the member has confirmed identity out of
 * band (call / WhatsApp / in person). Surfacing it via email could
 * also tip off an attacker who's compromised the email account.
 */
export async function adminClearMemberPassword(
  recordId: string,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  try {
    const member = await getMemberById(recordId);
    if (!member) return { ok: false, error: "Member not found" };

    if (!member.passwordHash) {
      // Already cleared — idempotent. Return the current member so the
      // table can refresh its row state without an error toast.
      return { ok: true, member };
    }

    const newNotes = splicePasswordHashIntoNotes(member.notes ?? "", null);
    await updateMember(recordId, {
      [AIRTABLE_FIELDS.notes]: newNotes,
    });

    const updated = await getMemberById(recordId);
    if (!updated) throw new Error("Member disappeared after update");
    return { ok: true, member: updated };
  } catch (err) {
    console.error("adminClearMemberPassword error:", err);
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Failed to clear password",
    };
  }
}

export async function toggleMonthPayment(
  recordId: string,
  month: string,
  paid: boolean,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  const monthOk = z.enum(MonthNamesTuple).safeParse(month);
  if (!monthOk.success) return { ok: false, error: "Invalid month" };

  try {
    const member = await setMonthPayment(recordId, monthOk.data, Boolean(paid));
    return { ok: true, member };
  } catch (err) {
    console.error("toggleMonthPayment error:", err);
    return { ok: false, error: "Airtable update failed" };
  }
}

export async function updateMemberStatus(
  recordId: string,
  status: MemberStatus,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  const statusOk = z.enum(StatusValues).safeParse(status);
  if (!statusOk.success) return { ok: false, error: "Invalid status" };

  try {
    const member = await adminUpdateMember(recordId, {
      [AIRTABLE_FIELDS.status]: statusOk.data,
    });
    return { ok: true, member };
  } catch (err) {
    console.error("updateMemberStatus error:", err);
    return { ok: false, error: "Airtable update failed" };
  }
}

export async function updateMemberKyc(
  recordId: string,
  kycStatus: KycStatus,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  const kycOk = z.enum(KycValues).safeParse(kycStatus);
  if (!kycOk.success) return { ok: false, error: "Invalid KYC status" };

  try {
    // Read prev state so we can fire the verified-email only on the
    // not-Complete → Complete transition. Otherwise an admin toggling
    // around (Complete → In Progress → Complete) would spam members.
    const prev = await getMemberById(recordId);
    const wasAlreadyComplete = prev?.kycStatus === "Complete";

    const member = await adminUpdateMember(recordId, {
      [AIRTABLE_FIELDS.kycStatus]: kycOk.data,
    });

    if (!wasAlreadyComplete && kycOk.data === "Complete" && member.email) {
      sendKycVerifiedEmail({
        to: member.email,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
      }).catch((err) =>
        console.error("KYC verified email failed (updateMemberKyc):", err),
      );
    }

    return { ok: true, member };
  } catch (err) {
    console.error("updateMemberKyc error:", err);
    return { ok: false, error: "Airtable update failed" };
  }
}

/**
 * Approve a member's KYC submission. Flips kycStatus → "Complete" and
 * stamps kycVerifiedAt with today's date (YYYY-MM-DD — the column is a
 * date-only field, so a full ISO timestamp gets rejected). Used from
 * the admin KYC review queue once the admin has visually confirmed
 * the ID + proof of address attachments match the form data.
 */
export async function adminApproveKyc(
  recordId: string,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  try {
    // Same transition guard as updateMemberKyc — only email on the
    // not-Complete → Complete edge so re-approvals don't double-fire.
    const prev = await getMemberById(recordId);
    const wasAlreadyComplete = prev?.kycStatus === "Complete";

    const member = await adminUpdateMember(recordId, {
      [AIRTABLE_FIELDS.kycStatus]: "Complete",
      [AIRTABLE_FIELDS.kycVerifiedAt]: todayDate(),
    });

    if (!wasAlreadyComplete && member.email) {
      sendKycVerifiedEmail({
        to: member.email,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
      }).catch((err) =>
        console.error("KYC verified email failed (adminApproveKyc):", err),
      );
    }

    return { ok: true, member };
  } catch (err) {
    console.error("adminApproveKyc error:", err);
    return { ok: false, error: "Airtable update failed" };
  }
}

/**
 * Reject a KYC submission and ask the member to re-upload one or both
 * documents. Flips kycStatus back to "Docs Requested" — the member
 * portal then re-renders the upload card with both slots accepting new
 * files. The original attachments stay in Airtable (admins can clear
 * them manually if needed) so we have an audit trail of what was sent.
 *
 * Notably this action does NOT touch any other onboarding field — id
 * type, id number, address, beneficiary, contributions schedule, etc.
 * are preserved. Only `kycStatus` changes.
 */
export async function adminRequestKycResubmission(
  recordId: string,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  try {
    const member = await adminUpdateMember(recordId, {
      [AIRTABLE_FIELDS.kycStatus]: "Docs Requested",
    });
    return { ok: true, member };
  } catch (err) {
    console.error("adminRequestKycResubmission error:", err);
    return { ok: false, error: "Airtable update failed" };
  }
}

/**
 * Clear a single KYC attachment slot (`id` or `poa`) for one member —
 * the surgical undo for "I uploaded the wrong file" or "I uploaded to
 * the wrong member" mistakes.
 *
 * Only the targeted slot is wiped. The other slot, kycStatus,
 * onboarding fields, and contributions are all preserved. If the
 * targeted slot was the LAST attachment present and the member's
 * status was "In Progress" (auto-flipped on the first upload),
 * status reverts to "Docs Requested" so the admin queue reflects
 * the empty state. Members already at "Complete" stay Complete —
 * an admin clearing one attachment after verification was a
 * deliberate choice (e.g. replacing a stale POA), not a roll-back
 * of the verification.
 */
export async function adminClearKycAttachment(
  recordId: string,
  slot: "id" | "poa",
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };
  if (slot !== "id" && slot !== "poa") {
    return { ok: false, error: "Invalid slot" };
  }

  try {
    const fieldId =
      slot === "id"
        ? AIRTABLE_FIELDS.kycIdDocument
        : AIRTABLE_FIELDS.kycProofOfAddress;

    // Clear only the targeted slot — Airtable's PATCH on a
    // multipleAttachments field replaces the array, so an empty
    // array drops every attachment in that slot in a single write.
    let member = await adminUpdateMember(recordId, {
      [fieldId]: [],
    });

    // Reflect the new state in kycStatus. If both slots are now
    // empty AND we're mid-review ("In Progress"), drop back to
    // "Docs Requested" so the queue copy ("Awaiting Proof of
    // Address") doesn't lie. We don't touch "Complete" because a
    // verified member who has one slot cleared is still verified;
    // the admin can re-flip via Resubmission if they want.
    const idStillPresent = (member.kycIdDocument?.length ?? 0) > 0;
    const poaStillPresent = (member.kycProofOfAddress?.length ?? 0) > 0;
    if (
      !idStillPresent &&
      !poaStillPresent &&
      member.kycStatus === "In Progress"
    ) {
      member = await adminUpdateMember(recordId, {
        [AIRTABLE_FIELDS.kycStatus]: "Docs Requested",
      });
    }

    return { ok: true, member };
  } catch (err) {
    console.error("adminClearKycAttachment error:", err);
    return { ok: false, error: "Airtable update failed" };
  }
}

// ─── Manual member creation (admin add-on-behalf) ─────────────────────
//
// Use case: a prospect submits KYC docs by email (lehumo@limepages.co.za)
// before — or instead of — going through the public onboarding form.
// Without this action there'd be no Airtable row for them, so admin
// can't park their docs anywhere or track their KYC progress.
//
// Mirrors the public `/api/lehumo/onboard` flow as closely as possible:
//   - same dedup-by-email guard
//   - same auto-assign of the next member number
//   - same default state (Status=Onboarding, kycStatus=Docs Requested)
//   - same opt-in welcome email (admin can suppress for back-channel members)
const SourceValues = [
  "Google",
  "Instagram",
  "Referral",
  "WhatsApp",
  "Direct",
] as const;

const AdminCreateMemberSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: emailField,
  phone: z.string().min(10, "Phone is required"),
  source: z.enum(SourceValues),
  idType: z.enum(["sa_id", "passport"]).optional(),
  idNumber: z.string().optional(),
  residentialAddress: z.string().optional(),
  sendWelcomeEmail: z.boolean().default(true),
});

export type AdminCreateMemberInput = z.input<typeof AdminCreateMemberSchema>;

export async function adminCreateMember(
  input: AdminCreateMemberInput,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const parsed = AdminCreateMemberSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
    return { ok: false, error: firstIssue };
  }
  const data = parsed.data;

  try {
    // Dedup-by-email — surface the existing record so admin can act on
    // it instead of creating a duplicate row that would split the audit
    // trail. The error message includes their member number so it's
    // immediately searchable in the table below.
    const existing = await findMemberByEmail(data.email);
    if (existing) {
      return {
        ok: false,
        error: `Email already registered as ${formatMemberNumber(existing.memberNumber)} (${existing.fullName || "no name"} · ${existing.status}). Use the table below to manage this member.`,
      };
    }

    const memberNumber = await getNextMemberNumber();
    const member = await createMember({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      source: data.source,
      memberNumber,
      idType: data.idType,
      idNumber: data.idNumber,
      residentialAddress: data.residentialAddress,
    });

    // Welcome email is best-effort — log + ignore on failure so an
    // SMTP hiccup doesn't roll back a successful Airtable create.
    if (data.sendWelcomeEmail) {
      sendWelcomeEmail({
        to: member.email,
        fullName: member.fullName,
        memberNumber: member.memberNumber,
      }).catch((err) =>
        console.error("Welcome email failed (admin create):", err),
      );
    }

    return { ok: true, member };
  } catch (err) {
    console.error("adminCreateMember error:", err);
    return { ok: false, error: "Could not create member. Check Airtable connectivity." };
  }
}

/**
 * Admin-on-behalf beneficiary write.
 *
 * Mirror of the member-portal POST /api/lehumo/portal/member/beneficiary
 * route, gated on `getAdminSession()` instead of the member session.
 *
 * Use case: a member emails / phones in their next-of-kin details
 * before they've onboarded onto the portal themselves, OR an admin is
 * fixing a typo in a beneficiary record without making the member
 * re-enter everything from their phone.
 *
 * Validation reuses BeneficiaryFormSchema so the rules are identical
 * across both surfaces:
 *   - firstName + surname + relationship required
 *   - phone OR email OR address (at least one contact channel)
 *   - emails must look like emails, etc.
 *
 * setMemberBeneficiary always stamps `beneficiaryUpdatedAt` so the
 * "On file" pill reflects how stale the record is.
 */
export async function adminSetMemberBeneficiary(
  recordId: string,
  fields: BeneficiaryFormData,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  // Re-validate server-side. The client should have done this too, but
  // never trust the wire — same defensive pattern as adminCreateMember.
  const parsed = BeneficiaryFormSchema.safeParse(fields);
  if (!parsed.success) {
    const firstIssue =
      parsed.error.issues[0]?.message ?? "Invalid beneficiary details";
    return { ok: false, error: firstIssue };
  }

  try {
    const member = await setMemberBeneficiary(recordId, {
      firstName: parsed.data.firstName,
      surname: parsed.data.surname,
      relationship: parsed.data.relationship,
      phone: parsed.data.phone,
      email: parsed.data.email,
      address: parsed.data.address,
    });
    return { ok: true, member };
  } catch (err) {
    console.error("adminSetMemberBeneficiary error:", err);
    return { ok: false, error: "Could not save beneficiary. Try again." };
  }
}

// ── Contributions admin actions ──────────────────────────────────
//
// Two thin wrappers around lib/contributions.ts helpers. Used by the
// AdminContributionsTable on /lehumo/portal/admin/contributions for
// inline status edits + reconciliation flips. Both gated by
// requireAdmin and return the freshly-PATCHed contribution row so
// the client can splice it into local state without a refetch.

const ContributionStatusValues = Object.values(
  CONTRIBUTION_STATUS,
) as [string, ...string[]];

export type ContributionActionResult =
  | { ok: true; contribution: LehumoContribution }
  | { ok: false; error: string };

/**
 * Adjust a contribution row's status (Pending / Paid / Failed /
 * Refunded / Waived). Does NOT touch payment metadata — admins
 * who need to record a payment use the LogManualDepositCard
 * (which routes through logEftPayment), not this action.
 *
 * The Status select dropdown on the contributions table calls
 * this on every change.
 */
export async function adminUpdateContributionStatus(
  recordId: string,
  status: ContributionStatus,
): Promise<ContributionActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as ContributionActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  const statusOk = z.enum(ContributionStatusValues).safeParse(status);
  if (!statusOk.success) return { ok: false, error: "Invalid status" };

  try {
    const contribution = await updateContribution(recordId, {
      status: statusOk.data as ContributionStatus,
    });
    return { ok: true, contribution };
  } catch (err) {
    console.error("adminUpdateContributionStatus error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Status update failed",
    };
  }
}

/**
 * Mark a Paid contribution row as reconciled. Stamps the current
 * admin's email + timestamp via the existing reconcileContribution
 * helper. Convention: reconciliation is a one-way ratchet — the
 * unreconcile path exists for corrections but isn't exposed here.
 */
export async function adminReconcileContribution(
  recordId: string,
): Promise<ContributionActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Forbidden" };

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  try {
    const contribution = await reconcileContribution(recordId, session.email);
    return { ok: true, contribution };
  } catch (err) {
    console.error("adminReconcileContribution error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reconcile failed",
    };
  }
}

// ── Void / reallocate a contribution payment ──────────────────────
//
// Void: reset a row back to Pending (clears received / reference / date
// / reconciliation) so a mis-booked month re-opens. Reallocate: move a
// payment onto another month's row for the same member and void the
// source — used when a payment landed on the wrong month (e.g. an EFT
// meant for July that auto-allocated to August).

export async function adminVoidContribution(
  recordId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Forbidden" };

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  try {
    await voidContributionAdmin(recordId);
    return { ok: true };
  } catch (err) {
    console.error("adminVoidContribution error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Void failed",
    };
  }
}

const ReallocateSchema = z.object({
  recordId: z.string().startsWith("rec"),
  memberRecordId: z.string().startsWith("rec"),
  targetPeriod: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM"),
});

export async function adminReallocateContribution(input: {
  recordId: string;
  memberRecordId: string;
  targetPeriod: string;
}): Promise<
  | { ok: true; targetPeriod: string; amount: number }
  | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Forbidden" };

  const parsed = ReallocateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const res = await reallocateContributionAdmin({
      sourceRecordId: parsed.data.recordId,
      memberRecordId: parsed.data.memberRecordId,
      targetPeriod: parsed.data.targetPeriod,
    });
    return { ok: true, targetPeriod: res.targetPeriod, amount: res.amount };
  } catch (err) {
    console.error("adminReallocateContribution error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Reallocation failed",
    };
  }
}

// ── Edit / reassign a contribution row ────────────────────────────
//
// Routes through one of two underlying helpers based on what the
// admin changed:
//
//   1. Member or Period changed (the composite-key flow) →
//      reassignContribution(). Handles uniqueness check + key
//      recomputation in one PATCH.
//   2. Anything else (status, source, amounts, reference, date,
//      notes) → updateContribution(). Plain field PATCH.
//
// If BOTH a reassignment AND field updates are in the same patch,
// reassignment runs first (so the row is in the right slot before
// the metadata write lands). The metadata PATCH is a separate
// follow-up call — same record id, just the non-reassignment
// fields.

const ContributionSourceValues = Object.values(
  CONTRIBUTION_SOURCE,
) as [string, ...string[]];

const AdminUpdateContributionSchema = z
  .object({
    status: z.enum(ContributionStatusValues).optional(),
    amountExpected: z.number().min(0).optional(),
    // null clears the field; number sets it. Empty string from the
    // form gets converted to null upstream by the caller before this
    // schema runs.
    amountReceived: z.number().min(0).nullable().optional(),
    source: z.enum(ContributionSourceValues).nullable().optional(),
    paymentReference: z.string().max(200).optional(),
    paymentDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .optional(),
    notes: z.string().max(500).optional(),
    // Reassignment block — if either of these differs from the
    // current row, the server routes through reassignContribution.
    memberId: z.string().startsWith("rec").optional(),
    period: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM")
      .optional(),
  })
  .strict();

export type AdminUpdateContributionInput = z.input<
  typeof AdminUpdateContributionSchema
>;

export async function adminUpdateContribution(
  recordId: string,
  patch: AdminUpdateContributionInput,
): Promise<ContributionActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as ContributionActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  const parsed = AdminUpdateContributionSchema.safeParse(patch);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const input = parsed.data;

  try {
    // Read the current row so we can detect "did member or period
    // actually change?" — only the diff routes through the
    // reassignment path.
    const current = await getContributionById(recordId);
    if (!current) return { ok: false, error: "Contribution not found" };

    const memberChanged =
      input.memberId !== undefined && input.memberId !== current.memberId;
    const periodChanged =
      input.period !== undefined && input.period !== current.period;
    const needsReassign = memberChanged || periodChanged;

    let row: LehumoContribution = current;

    if (needsReassign) {
      // Resolve the target memberId — current row's if unchanged,
      // otherwise from the patch.
      const targetMemberId = memberChanged
        ? (input.memberId as string)
        : current.memberId;
      // Resolve the canonical memberNumber server-side (don't trust
      // the client's view of the cohort).
      const targetMember = await getMemberById(targetMemberId);
      if (!targetMember) {
        return {
          ok: false,
          error:
            "Target member not found — they may have been deleted. Pick another member.",
        };
      }
      const targetPeriod = periodChanged
        ? (input.period as string)
        : current.period;

      row = await reassignContribution(
        recordId,
        targetMemberId,
        targetMember.memberNumber,
        targetPeriod,
      );
    }

    // Apply the non-reassignment fields (if any) as a separate PATCH.
    // `updateContribution`'s patch type doesn't include memberId /
    // period / contributionKey, so the destructured shape below is
    // safe to forward.
    const fieldPatch: Parameters<typeof updateContribution>[1] = {};
    // Cast — the Zod enum is built from `Object.values(CONTRIBUTION_STATUS)`
    // which TypeScript widens to `string`, but the runtime values are
    // guaranteed to be valid ContributionStatus members by the enum check.
    if (input.status !== undefined)
      fieldPatch.status = input.status as ContributionStatus;
    if (input.amountExpected !== undefined)
      fieldPatch.amountExpected = input.amountExpected;
    if (input.amountReceived !== undefined)
      // Pass null through as 0 — Airtable's number field doesn't
      // store null, but 0 reads as "unset" everywhere in the UI.
      fieldPatch.amountReceived = input.amountReceived ?? 0;
    if (input.source !== undefined && input.source !== null)
      fieldPatch.source = input.source as ContributionSource;
    if (input.paymentReference !== undefined)
      fieldPatch.paymentReference = input.paymentReference;
    if (input.paymentDate !== undefined)
      fieldPatch.paymentDate = input.paymentDate;
    if (input.notes !== undefined) fieldPatch.notes = input.notes;

    if (Object.keys(fieldPatch).length > 0) {
      row = await updateContribution(recordId, fieldPatch);
    }

    return { ok: true, contribution: row };
  } catch (err) {
    console.error("adminUpdateContribution error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Update failed",
    };
  }
}

/**
 * Build a human-friendly label for one or more contribution periods,
 * collapsing consecutive months in the same year. Used for the EFT
 * receipt email's `monthLabel` field so a R3,000 deposit spanning
 * three months reads "Jun + Jul + Aug 2026" instead of three
 * separate emails.
 *
 *   ["2026-06"]                    → "June 2026"
 *   ["2026-06","2026-07"]          → "Jun + Jul 2026"
 *   ["2026-06","2026-07","2026-08"] → "Jun + Jul + Aug 2026"
 *   ["2026-11","2026-12","2027-01"] → "Nov 2026 + Dec 2026 + Jan 2027"
 */
function buildMultiPeriodLabel(periods: string[]): string {
  if (periods.length === 0) return "";

  const sorted = [...periods].sort();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthsLong = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Single-period: use the long month name so the email reads
  // naturally — "We've received your June 2026 contribution".
  if (sorted.length === 1) {
    const [yr, m] = sorted[0].split("-");
    const idx = Number(m) - 1;
    return `${monthsLong[idx] ?? m} ${yr}`;
  }

  // Multi-period: detect whether every period falls in the same
  // calendar year. If so, render the months short and append a
  // single year suffix ("Jun + Jul + Aug 2026"). If not, year
  // each (most common case is a Dec→Jan crossover).
  const years = new Set(sorted.map((p) => p.split("-")[0]));
  if (years.size === 1) {
    const year = [...years][0];
    const monthLabels = sorted.map((p) => {
      const m = Number(p.split("-")[1]) - 1;
      return months[m] ?? p;
    });
    return `${monthLabels.join(" + ")} ${year}`;
  }
  return sorted
    .map((p) => {
      const [yr, m] = p.split("-");
      const idx = Number(m) - 1;
      return `${months[idx] ?? m} ${yr}`;
    })
    .join(" + ");
}

// ──────────────────────────────────────────────────────────────────────
// adminBackfillMemberSchedule — regenerate any missing schedule rows
// ──────────────────────────────────────────────────────────────────────
//
// Surfaced via the "Regenerate" button next to the warning chip on
// the Contributions rollup table. Used to repair members whose
// schedule was generated incompletely (Ramudzuli: only 1 row,
// Tshwaro: only 2 rows, Londani: missing July 2026).
//
// Idempotent — calls `ensureCanonicalMemberSchedule` which only
// inserts missing rows in the Jun 2026 → May 2031 window. Existing
// rows (paid, reconciled, whatever) are never touched. Safe to
// click the Regenerate button twice in a row.

export type AdminBackfillScheduleResult =
  | { ok: true; generated: number }
  | { ok: false; error: string };

export async function adminBackfillMemberSchedule(
  memberId: string,
): Promise<AdminBackfillScheduleResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminBackfillScheduleResult;

  const idOk = IdSchema.safeParse(memberId);
  if (!idOk.success) return { ok: false, error: "Invalid member id" };

  try {
    const member = await getMemberById(memberId);
    if (!member) return { ok: false, error: "Member not found" };

    const res = await ensureCanonicalMemberSchedule({
      memberId: member.id,
      memberNumber: member.memberNumber,
    });
    if (!res.ok) return { ok: false, error: res.error };
    return { ok: true, generated: res.generated };
  } catch (err) {
    console.error("adminBackfillMemberSchedule error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Schedule backfill failed",
    };
  }
}

// ──────────────────────────────────────────────────────────────────────
// adminUpdateFundPortfolio — edit the member-facing portfolio + strategy
// ──────────────────────────────────────────────────────────────────────
//
// Backs the "Where is our money now?" admin editor on the Settings page.
// Writes the singleton Lehumo Fund Settings row; the member portal reads
// it via getFundPortfolio(). Gated by requireAdmin; the admin's email is
// stamped onto the Updated By audit field.

export type FundPortfolioActionResult =
  | { ok: true; portfolio: FundPortfolio }
  | { ok: false; error: string };

export async function adminUpdateFundPortfolio(
  input: FundPortfolioInput,
): Promise<FundPortfolioActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Forbidden" };

  const parsed = FundPortfolioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const portfolio = await upsertFundPortfolio(parsed.data, session.email);
    return { ok: true, portfolio };
  } catch (err) {
    console.error("adminUpdateFundPortfolio error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save portfolio",
    };
  }
}

// ──────────────────────────────────────────────────────────────────────
// adminUpdateFundInterest — manually-entered pool interest earned
// ──────────────────────────────────────────────────────────────────────
//
// Backs the "Pool interest earned" input on the admin Portfolio page.
// Writes the same Fund Settings singleton (just the Interest Earned
// field) and feeds the member dashboard's Interest Earned tile. Gated
// by requireAdmin; stamps Updated By.

export async function adminUpdateFundInterest(
  input: FundInterestInput,
): Promise<FundPortfolioActionResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Forbidden" };

  const parsed = FundInterestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  try {
    const portfolio = await upsertFundInterest(
      parsed.data.interestEarned,
      session.email,
    );
    return { ok: true, portfolio };
  } catch (err) {
    console.error("adminUpdateFundInterest error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save interest",
    };
  }
}
