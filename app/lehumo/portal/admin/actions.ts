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
