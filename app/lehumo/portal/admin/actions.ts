"use server";

import { z } from "zod";

import { getAdminSession } from "@/lib/admin-auth";
import {
  adminUpdateMember,
  setMonthPayment,
} from "@/lib/airtable-admin";
import {
  AIRTABLE_FIELDS,
  MONTH_NAMES,
  MEMBER_STATUS,
  KYC_STATUS,
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
    const member = await adminUpdateMember(recordId, {
      [AIRTABLE_FIELDS.kycStatus]: kycOk.data,
    });
    return { ok: true, member };
  } catch (err) {
    console.error("updateMemberKyc error:", err);
    return { ok: false, error: "Airtable update failed" };
  }
}

/**
 * Approve a member's KYC submission. Flips kycStatus → "Complete" and
 * stamps kycVerifiedAt with the current ISO timestamp. Used from the
 * admin KYC review queue once the admin has visually confirmed the ID
 * + proof of address attachments match the form data.
 */
export async function adminApproveKyc(
  recordId: string,
): Promise<AdminActionResult> {
  const gate = await requireAdmin();
  if (!gate.ok) return gate as AdminActionResult;

  const idOk = IdSchema.safeParse(recordId);
  if (!idOk.success) return { ok: false, error: "Invalid record id" };

  try {
    const member = await adminUpdateMember(recordId, {
      [AIRTABLE_FIELDS.kycStatus]: "Complete",
      [AIRTABLE_FIELDS.kycVerifiedAt]: new Date().toISOString(),
    });
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
