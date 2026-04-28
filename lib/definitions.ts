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
    }
  | {
      kind: "available";
      monthsContributed: number;
      contributedZAR: number;
      maxAvailableZAR: number; // min(contributed × 20%, R20k)
      availableZAR: number; // maxAvailableZAR (no active draw to subtract)
      capReason: "percent" | "ceiling";
    }
  | {
      kind: "active-loan";
      monthsContributed: number;
      contributedZAR: number;
      maxAvailableZAR: number;
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
  const monthsContributed = Object.values(member.contributions).filter(
    Boolean,
  ).length;

  if (monthsContributed < EMERGENCY_ACCESS_TENURE_MONTHS) {
    return {
      kind: "locked",
      monthsContributed,
      monthsRemaining: EMERGENCY_ACCESS_TENURE_MONTHS - monthsContributed,
    };
  }

  const contributedZAR = monthsContributed * EMERGENCY_ACCESS_MONTHLY_ZAR;
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
    email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .max(200, "Email is too long")
      .optional()
      .or(z.literal("")),
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
