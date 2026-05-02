"use server";

import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import {
  adminUpdateMember,
  setMonthPayment,
} from "@/lib/airtable-admin";
import {
  createMember,
  findMemberByEmail,
  getMemberById,
  getNextMemberNumber,
} from "@/lib/airtable";
import { sendKycVerifiedEmail, sendWelcomeEmail } from "@/lib/email";
import {
  AIRTABLE_FIELDS,
  MONTH_NAMES,
  MEMBER_STATUS,
  KYC_STATUS,
  emailField,
  formatMemberNumber,
  todayDate,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
} from "@/lib/definitions";

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
