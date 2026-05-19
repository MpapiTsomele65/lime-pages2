import "server-only";

import type { LehumoMember } from "./definitions";

/**
 * Cohort email-blast campaigns. Each entry captures the send date +
 * the recipient email list at send-time. The AdminCampaignTracker
 * compares the recipient list against the live member roster to see
 * who's progressed since the blast.
 *
 * Why a hardcoded file instead of an Airtable table:
 *   1. Campaigns are infrequent (a handful per year) — overhead of a
 *      proper table doesn't pay back.
 *   2. The PAT we run with doesn't have schema-write permissions
 *      anyway (we'd need to ask Mpapi to add a Campaigns table
 *      manually).
 *   3. Recipient lists are versioned alongside code in git — the audit
 *      trail of "who got what email when" lives in commit history.
 *
 * When sending a new cohort blast, append a new entry here with the
 * recipient list captured at the moment the script ran.
 */

export interface CohortCampaign {
  /** Stable identifier. Lowercase kebab-case. */
  id: string;
  /** Human-readable name shown on the admin widget. */
  name: string;
  /** YYYY-MM-DD SAST. */
  sentAt: string;
  /** One-line description of the campaign's intent. */
  description: string;
  /** Recipient emails (lowercase, deduplicated). */
  recipientEmails: string[];
}

export const COHORT_CAMPAIGNS: CohortCampaign[] = [
  {
    id: "cohort-blast-1",
    name: "First cohort blast — 19 days",
    sentAt: "2026-05-13",
    description:
      "Founding-member update covering steering committee, QGM dates, payments live, and the call to complete registration.",
    recipientEmails: [
      "lseabi@gmail.com",
      "srngwaku@gmail.com",
      "sitholebontleleko@gmail.com",
      "amomaledu@gmail.com",
      "mbalisebokedi@gmail.com",
      "nkhensani.mkhari@thenewcentre.org",
      "kmokhele01@gmail.com",
      "mtsomele@oldmutual.com",
      "tshomarelo7@gmail.com",
      "leratobogoshi68@gmail.com",
      "phenyogasebonoe@gmail.com",
      "psimelane@psa-law.co.za",
      "reabetswellale@gmail.com",
      "trinity.thobejane525@gmail.com",
      "obimakapane@gmail.com",
      "k.t.tshabalala@gmail.com",
      "oarabilemoima@gmail.com",
      "lethaboramothibe@yahoo.com",
      "mabasashiluva@icloud.com",
      "heshunkosazana@gmail.com",
      "kenie18keneilwe@gmail.com",
      "jmangokoane@gmail.com",
      "fncebekhulu95@gmail.com",
      "kgano@gmail.com",
      "otisolifant@gmail.com",
      "tshwarolets@gmail.com",
      "mashegotolamo@gmail.com",
    ],
  },
  {
    id: "nudge-2-11-days",
    name: "Second nudge — 11 days",
    sentAt: "2026-05-19",
    description:
      "Short follow-up to non-onboarded members + Mahlatse: 11 days to go, complete registration in under 2 minutes.",
    recipientEmails: [
      "lseabi@gmail.com",
      "srngwaku@gmail.com",
      "nkhensani.mkhari@thenewcentre.org",
      "leratobogoshi68@gmail.com",
      "phenyogasebonoe@gmail.com",
      "psimelane@psa-law.co.za",
      "obimakapane@gmail.com",
      "lethaboramothibe@yahoo.com",
      "mabasashiluva@icloud.com",
      "kenie18keneilwe@gmail.com",
      "otisolifant@gmail.com",
      "mashegotolamo@gmail.com",
      "amomaledu@gmail.com",
      "kmokhele01@gmail.com",
      "reabetswellale@gmail.com",
      "k.t.tshabalala@gmail.com",
      "heshunkosazana@gmail.com",
      "fncebekhulu95@gmail.com",
    ],
  },
];

/**
 * Engagement bucket a member can fall into for a given campaign.
 *
 *   - `not_yet`: still in the original "needs to act" state. For most
 *     recipients this means Status=Prospect or
 *     Status=Onboarding+KYC=Not Started — same state they were in
 *     when the email went out.
 *   - `in_progress`: shows real movement — KYC submitted, but not yet
 *     Active. (Status=Onboarding with KYC progress, OR a lead who's
 *     since become a Prospect, etc.)
 *   - `converted`: fully Active = onboarded + paying. The win state.
 *   - `unreached`: recipient never had a Member record (pure lead
 *     who hasn't onboarded). Distinct from `not_yet` because they
 *     don't even have a Leh## yet.
 */
export type CampaignEngagement =
  | "not_yet"
  | "in_progress"
  | "converted"
  | "unreached";

function classify(member: LehumoMember | undefined): CampaignEngagement {
  if (!member) return "unreached";
  if (member.status === "Active") return "converted";
  if (member.status === "Onboarding" && member.kycStatus !== "Not Started") {
    return "in_progress";
  }
  // Prospect, Onboarding+KYC Not Started, On Hold — same buckets as
  // "not yet acted". On Hold is rare but treat as "stalled" rather
  // than "converted".
  return "not_yet";
}

export interface CampaignReport {
  campaign: CohortCampaign;
  /** Total recipients on the original list. */
  totalRecipients: number;
  /** Counts per engagement bucket. */
  counts: Record<CampaignEngagement, number>;
  /** Conversion percentage: converted / totalRecipients. Rounded. */
  conversionPct: number;
  /** Any-movement percentage: (converted + in_progress) / totalRecipients. */
  anyMovementPct: number;
  /** Per-recipient breakdown so the UI can list who's where. */
  recipients: Array<{
    email: string;
    engagement: CampaignEngagement;
    memberNumber?: number;
    fullName?: string;
  }>;
}

/**
 * Compute conversion analytics for every cohort campaign against the
 * current live member roster. Pass the result of `listAllMembers()` —
 * the function is pure and re-uses the snapshot the admin page
 * already fetches for its stat tiles.
 */
export function computeCampaignReports(
  members: LehumoMember[],
): CampaignReport[] {
  // Build an email → member index once, lowercased.
  const byEmail = new Map<string, LehumoMember>();
  for (const m of members) {
    if (m.email) byEmail.set(m.email.toLowerCase(), m);
  }

  return COHORT_CAMPAIGNS.map((campaign) => {
    const counts: Record<CampaignEngagement, number> = {
      not_yet: 0,
      in_progress: 0,
      converted: 0,
      unreached: 0,
    };
    const recipients = campaign.recipientEmails.map((email) => {
      const member = byEmail.get(email.toLowerCase());
      const engagement = classify(member);
      counts[engagement] += 1;
      return {
        email,
        engagement,
        memberNumber: member?.memberNumber,
        fullName: member?.fullName,
      };
    });
    const total = campaign.recipientEmails.length;
    const conversionPct =
      total > 0 ? Math.round((counts.converted / total) * 100) : 0;
    const anyMovementPct =
      total > 0
        ? Math.round(((counts.converted + counts.in_progress) / total) * 100)
        : 0;
    return {
      campaign,
      totalRecipients: total,
      counts,
      conversionPct,
      anyMovementPct,
      recipients,
    };
  });
}
