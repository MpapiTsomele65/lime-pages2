import type { LehumoMember, MemberPlan } from "./definitions";

/**
 * Derived member flags shared across the portal sections (Overview +
 * Manage-my-contributions). Kept in one pure helper so the split section
 * pages compute them identically — previously these lived inline in the
 * single DashboardOverview.
 */
export interface PortalMemberView {
  firstName: string;
  /** Lifetime R contributed — sum of `amountReceived` on Paid rows, with
   *  the 12-month boolean projection as the flag-off fallback. */
  myContributed: number;
  /** Has any contribution landed (Paystack / reconciled EFT). */
  hasFirstContribution: boolean;
  /** Verified but not yet paid → show the first-payment setup ceremony. */
  needsPaymentSetup: boolean;
  memberPlan: MemberPlan;
}

export function derivePortalMemberView(member: LehumoMember): PortalMemberView {
  const myContributed = member.contributionRows
    ? member.contributionRows.reduce(
        (sum, row) =>
          row.status === "Paid" && row.amountReceived
            ? sum + row.amountReceived
            : sum,
        0,
      )
    : Object.values(member.contributions).filter(Boolean).length * 1000;

  const hasFirstContribution = member.contributionRows
    ? member.contributionRows.some((row) => row.status === "Paid")
    : Object.values(member.contributions).some(Boolean);

  return {
    firstName: member.fullName.split(" ")[0],
    myContributed,
    hasFirstContribution,
    needsPaymentSetup: member.kycStatus === "Complete" && !hasFirstContribution,
    memberPlan: member.plan ?? "standard",
  };
}
