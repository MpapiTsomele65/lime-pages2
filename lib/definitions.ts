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

// ─── TypeScript Types ───────────────────────────────────────────────
export type MemberStatus = (typeof MEMBER_STATUS)[keyof typeof MEMBER_STATUS];
export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

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
  memberNumber: z.coerce.number().int().positive("Please enter a valid member number"),
});

export const OnboardingFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  source: z.enum(["Google", "Instagram", "Referral", "WhatsApp", "Direct"]),
});

export const PaystackInitSchema = z.object({
  email: z.string().email(),
  memberRecordId: z.string().startsWith("rec"),
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;
export type OnboardingFormData = z.infer<typeof OnboardingFormSchema>;
