import {
  MONTH_NAMES,
  computeEmergencyAccess,
  hasBeneficiary,
  type LehumoMember,
} from "./definitions";

/**
 * Per-month contribution amount in ZAR. Centralised so any future change
 * (e.g. R1500 in Phase 2) updates every admin tile that derives a Rand
 * total from contribution counts.
 */
export const MONTHLY_CONTRIBUTION_ZAR = 1000;

/** Active or onboarding members are "in the pipeline" for completeness math. */
function isInPipeline(m: LehumoMember): boolean {
  return m.status !== "Exited" && m.status !== "Prospect";
}

/**
 * Returns how many months of the year up to (and including) `currentMonth`
 * a member has paid. Used for "behind by N months" math.
 */
function monthsPaidYearToDate(
  m: LehumoMember,
  currentMonthIndex: number,
): number {
  let count = 0;
  for (let i = 0; i <= currentMonthIndex; i++) {
    if (m.contributions[MONTH_NAMES[i]]) count++;
  }
  return count;
}

/**
 * Compute the full set of admin-overview metrics from the member list.
 *
 * The admin dashboard derives every KPI / health bar / behind-list from
 * one in-memory pass over the member array, so this lives in a pure
 * helper to keep the page server component compact and testable.
 *
 * `currentMonthIndex` is 0-indexed (Jan = 0). Pass `new Date().getMonth()`
 * from the page; we accept it as a parameter so tests can pin a month.
 */
export function computeAdminStats(
  members: LehumoMember[],
  currentMonthIndex: number,
) {
  const currentMonth = MONTH_NAMES[currentMonthIndex] ?? "Jan";
  const prevMonth =
    currentMonthIndex > 0 ? MONTH_NAMES[currentMonthIndex - 1] : null;

  const totalMembers = members.length;
  const activeMembers = members.filter((m) => m.status === "Active");
  const onboardingMembers = members.filter((m) => m.status === "Onboarding");
  const exitedMembers = members.filter((m) => m.status === "Exited");
  const onHoldMembers = members.filter((m) => m.status === "On Hold");

  // ── Completeness denominators: members "in the pipeline" (not exited /
  //    not prospect). Exited members shouldn't drag the community-health
  //    percentages down forever after they leave. ──
  const pipelineMembers = members.filter(isInPipeline);
  const pipelineCount = pipelineMembers.length || 1; // avoid /0

  const kycComplete = pipelineMembers.filter(
    (m) => m.kycStatus === "Complete",
  ).length;
  const kycPending = pipelineMembers.length - kycComplete;
  const beneficiaryOnFile = pipelineMembers.filter(hasBeneficiary).length;
  const beneficiaryMissing = pipelineMembers.length - beneficiaryOnFile;
  const madeFirstContribution = pipelineMembers.filter((m) =>
    Object.values(m.contributions).some(Boolean),
  ).length;

  // ── Pool / contribution totals across the whole roster ──
  const totalMonthsTicked = members.reduce(
    (sum, m) => sum + Object.values(m.contributions).filter(Boolean).length,
    0,
  );
  const totalContributed = totalMonthsTicked * MONTHLY_CONTRIBUTION_ZAR;

  // Pre-launch gate. Collections officially start 1 Jun 2026 — before
  // that there's no "this month" to be paid or "previous month" to be
  // behind on. Zero everything out at the source so admin KPIs and the
  // chase-up list don't surface phantom arrears from seed rows / smoke
  // tests that landed in May 2026. The gate keys on `currentMonth`
  // being earlier than June within the launch year, which matches the
  // member portal's `isBeforeLaunch()` semantic for the only year
  // where this matters (2026).
  const PRE_LAUNCH_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May"];
  const preLaunchMode = PRE_LAUNCH_MONTHS.includes(currentMonth);

  // ── This-month and previous-month contribution rates ──
  const paidThisMonth = preLaunchMode
    ? []
    : members.filter((m) => m.contributions[currentMonth]);
  const paidPrevMonth =
    preLaunchMode || !prevMonth
      ? []
      : members.filter((m) => m.contributions[prevMonth]);

  const activeIds = new Set(activeMembers.map((m) => m.id));
  const activePaidThisMonth = paidThisMonth.filter((m) =>
    activeIds.has(m.id),
  ).length;
  const activePaidPrevMonth = paidPrevMonth.filter((m) =>
    activeIds.has(m.id),
  ).length;
  const activeCount = activeMembers.length;

  const thisMonthRate =
    activeCount > 0 ? Math.round((activePaidThisMonth / activeCount) * 100) : 0;
  const prevMonthRate =
    activeCount > 0 && prevMonth
      ? Math.round((activePaidPrevMonth / activeCount) * 100)
      : null;

  // ── Falling behind: active members who haven't paid the current month,
  //    sorted by how many months they're behind (most behind first) so the
  //    chase-up list surfaces the worst offenders at the top. Pre-launch
  //    this list is empty by definition — no month is overdue yet. ──
  const behindNow = preLaunchMode
    ? []
    : activeMembers
        .filter((m) => !m.contributions[currentMonth])
        .map((m) => {
          const paidYTD = monthsPaidYearToDate(m, currentMonthIndex);
          const monthsBehindYTD = currentMonthIndex + 1 - paidYTD;
          return { member: m, paidYTD, monthsBehindYTD };
        })
        .sort((a, b) => b.monthsBehindYTD - a.monthsBehindYTD);

  // ── Lending ledger: pull each member's emergency-access state and
  //    aggregate the active-loan slice. computeEmergencyAccess is the
  //    single source of truth for the 6-month gate, 20% cap, and 90-day
  //    overdue check, so the admin dashboard reuses it rather than
  //    re-deriving the same rules here. ──
  const loanStates = members.map((m) => computeEmergencyAccess(m));
  const activeLoans = loanStates.flatMap((s) =>
    s.kind === "active-loan" ? [s] : [],
  );
  const totalLent = activeLoans.reduce(
    (sum, s) => sum + s.activeBalanceZAR,
    0,
  );
  const activeLoanCount = activeLoans.length;
  const overdueLoanCount = activeLoans.filter((s) => s.isOverdue).length;

  // ── Member capacity: 30 founding members → R30,000 / month → R360,000 / yr.
  //    Phase-1 cap is what the dashboard treats as "100% pool". ──
  const FOUNDING_CAP_MEMBERS = 30;
  const annualPoolCapZAR =
    FOUNDING_CAP_MEMBERS * MONTHLY_CONTRIBUTION_ZAR * 12;

  return {
    currentMonth,
    prevMonth,

    // Membership breakdown
    totalMembers,
    activeCount,
    onboardingCount: onboardingMembers.length,
    onHoldCount: onHoldMembers.length,
    exitedCount: exitedMembers.length,

    // Pipeline (denominator for completeness)
    pipelineCount: pipelineMembers.length,

    // Completeness rates (whole-numbers 0-100)
    kycComplete,
    kycPending,
    kycPct: Math.round((kycComplete / pipelineCount) * 100),
    beneficiaryOnFile,
    beneficiaryMissing,
    beneficiaryPct: Math.round((beneficiaryOnFile / pipelineCount) * 100),
    madeFirstContribution,
    firstContributionPct: Math.round(
      (madeFirstContribution / pipelineCount) * 100,
    ),

    // Pool tracking
    totalMonthsTicked,
    totalContributed,
    annualPoolCapZAR,
    poolFillPct: Math.min(
      100,
      Math.round((totalContributed / annualPoolCapZAR) * 100),
    ),

    // Lending ledger (Phase 1 emergency access)
    totalLent,
    activeLoanCount,
    overdueLoanCount,

    // Current-month vs previous-month contribution rate
    activePaidThisMonth,
    activePaidPrevMonth,
    thisMonthRate,
    prevMonthRate,

    // Behind list
    behindNow,
    behindCount: behindNow.length,
  };
}

export type AdminStats = ReturnType<typeof computeAdminStats>;
