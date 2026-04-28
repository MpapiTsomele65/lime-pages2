import { z } from "zod";

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
  // ── KYC / identity (optional — populated post-Tier 2A onboarding) ──
  idType?: "SA ID" | "Passport" | "";
  idNumber?: string;
  residentialAddress?: string;
  kycIdDocument?: AirtableAttachment[];
  kycProofOfAddress?: AirtableAttachment[];
  kycSubmittedAt?: string; // ISO date
  kycVerifiedAt?: string; // ISO date
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
  email: z.string().email("Please enter a valid email address"),
  memberNumber: z
    .union([z.string(), z.number()])
    .transform((v) => parseMemberNumber(v))
    .refine((v): v is number => v !== null, {
      message: "Please enter a valid member number (e.g. Leh01)",
    }),
});

export const OnboardingFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
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
  email: z.string().email(),
  memberRecordId: z.string().startsWith("rec"),
  plan: z.enum(["basic", "standard", "vip"]).optional(),
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;
export type OnboardingFormData = z.infer<typeof OnboardingFormSchema>;
