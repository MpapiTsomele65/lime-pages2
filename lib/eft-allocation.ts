import {
  CONTRIBUTION_STATUS,
  LEHUMO_FIRST_DUE_PERIOD,
  type LehumoContribution,
} from "./definitions";

/**
 * EFT (manual bank-transfer) payment allocation.
 *
 * The recon rule:
 *   • A R2,000 EFT against a R1,000/month plan should land as
 *     "Jun 2026 paid + Jul 2026 paid", not as a single overpaid row.
 *   • Allocation walks the member's schedule chronologically, oldest
 *     unpaid first, applying the EFT in `amountExpected`-sized chunks
 *     to each row until the cash runs out.
 *   • A row whose `amountReceived` is already partial (e.g. R500 sitting
 *     on Jul from a prior R1,500 EFT) gets topped up to its full
 *     expected amount before the next row gets anything.
 *   • Pre-launch rows (period < LEHUMO_FIRST_DUE_PERIOD) are never
 *     allocated to — they're not part of the schedule.
 *   • If the EFT exceeds what every unpaid row can absorb, the excess
 *     is surfaced as `remainder` so the admin sees the overpayment
 *     explicitly and can decide whether to refund, hold as credit, or
 *     skip.
 *
 * Pure function — no I/O, safe to call from server actions, API routes,
 * or client components (for preview-before-apply UIs).
 */

export type EftAllocationStatus = "fully-covers" | "partial";

export interface EftAllocationRow {
  /** Period (`YYYY-MM`) that gets allocated against. */
  period: string;
  /** Airtable record ID of the contribution row, so the apply step can
   *  PATCH directly without re-resolving the key. */
  recordId: string;
  /** The new total `amountReceived` value to write to the row after
   *  this allocation. Includes any pre-existing partial payment. */
  newAmountReceived: number;
  /** The R-amount this allocation contributes to the row (excludes
   *  any pre-existing partial — surfaced separately for the admin
   *  preview UI). */
  amountApplied: number;
  /** Whether this allocation pushes the row to fully Paid. */
  status: EftAllocationStatus;
}

export interface EftAllocationPlan {
  rows: EftAllocationRow[];
  /** Sum of `amountApplied` across all rows. Always ≤ the input `amount`. */
  totalApplied: number;
  /** `amount - totalApplied`. Non-zero when the EFT exceeds every
   *  remaining unpaid row's needs. Admin should decide what to do
   *  with the excess. */
  remainder: number;
  /** Convenience flag for the admin UI — true when remainder > 0. */
  hasOverpayment: boolean;
}

/**
 * Build an allocation plan for an EFT of `amount` ZAR against a member's
 * contribution schedule. Does NOT mutate `rows` — callers should pass
 * the plan to `applyEftAllocation` (in `lib/airtable-admin.ts`) to
 * execute the writes.
 */
export function allocateEftPayment(
  rows: LehumoContribution[],
  amount: number,
  /** Pin the whole deposit to a specific period (`YYYY-MM`) instead of
   *  the oldest-unpaid walk. Use when the admin needs to correct which
   *  month a manual payment lands on — e.g. a July EFT that the auto-walk
   *  would otherwise push to August because July's row was reset by a
   *  failed Paystack attempt. */
  targetPeriod?: string,
): EftAllocationPlan {
  if (!rows || rows.length === 0 || amount <= 0) {
    return { rows: [], totalApplied: 0, remainder: amount, hasOverpayment: amount > 0 };
  }

  // Oldest scheduled unpaid first. Sort defensively even though the
  // server-side hydration paths return sorted rows.
  const sorted = [...rows].sort((a, b) => a.period.localeCompare(b.period));

  // ── Targeted allocation ──
  // The admin explicitly pinned a month: apply the deposit to that one
  // period regardless of its current status (the choice overrides the
  // oldest-unpaid walk). A row already covered to its expected amount is
  // a no-op — the whole deposit surfaces as remainder so the admin sees
  // it wasn't needed there.
  if (targetPeriod) {
    const row = sorted.find((r) => r.period === targetPeriod);
    if (!row || row.period < LEHUMO_FIRST_DUE_PERIOD) {
      return { rows: [], totalApplied: 0, remainder: amount, hasOverpayment: amount > 0 };
    }
    const expected = row.amountExpected ?? 1000;
    const alreadyReceived = row.amountReceived ?? 0;
    const shortfall = Math.max(0, expected - alreadyReceived);
    if (shortfall <= 0) {
      return { rows: [], totalApplied: 0, remainder: amount, hasOverpayment: amount > 0 };
    }
    const apply = Math.min(amount, shortfall);
    return {
      rows: [
        {
          period: row.period,
          recordId: row.id,
          newAmountReceived: alreadyReceived + apply,
          amountApplied: apply,
          status: apply >= shortfall ? "fully-covers" : "partial",
        },
      ],
      totalApplied: apply,
      remainder: amount - apply,
      hasOverpayment: amount - apply > 0,
    };
  }

  const plan: EftAllocationRow[] = [];
  let remaining = amount;

  for (const row of sorted) {
    if (remaining <= 0) break;

    // Skip pre-launch seed rows + anything already fully paid /
    // refunded / waived. Failed rows are eligible for a fresh
    // allocation — that's exactly the recon case (Paystack failed,
    // member EFT'd manually). Pending + Failed both flow through.
    if (row.period < LEHUMO_FIRST_DUE_PERIOD) continue;
    if (
      row.status === CONTRIBUTION_STATUS.paid ||
      row.status === CONTRIBUTION_STATUS.refunded ||
      row.status === CONTRIBUTION_STATUS.waived
    ) {
      continue;
    }

    const expected = row.amountExpected ?? 1000;
    const alreadyReceived = row.amountReceived ?? 0;
    const shortfall = Math.max(0, expected - alreadyReceived);

    if (shortfall <= 0) {
      // Row's expected amount is already covered even though status
      // isn't Paid (data anomaly or partial that hit the threshold).
      // Don't allocate — leave the admin to fix the status manually.
      continue;
    }

    const apply = Math.min(remaining, shortfall);
    const newAmountReceived = alreadyReceived + apply;
    plan.push({
      period: row.period,
      recordId: row.id,
      newAmountReceived,
      amountApplied: apply,
      status: apply >= shortfall ? "fully-covers" : "partial",
    });
    remaining -= apply;
  }

  const totalApplied = amount - remaining;
  return {
    rows: plan,
    totalApplied,
    remainder: remaining,
    hasOverpayment: remaining > 0,
  };
}

/**
 * Format an allocation plan as a human-readable summary line for the
 * admin preview UI. Examples:
 *
 *   "R2,000 → Jun 2026 (R1,000) + Jul 2026 (R1,000)"
 *   "R1,500 → Jun 2026 (R1,000) + Jul 2026 (R500 partial)"
 *   "R5,000 → Jun + Jul + Aug + Sep 2026 (each R1,000) · R1,000 unallocated"
 *   "R0 — every scheduled row is already fully covered"
 */
export function summarizeEftAllocation(plan: EftAllocationPlan): string {
  if (plan.rows.length === 0) {
    return plan.remainder > 0
      ? `R${plan.remainder.toLocaleString("en-ZA")} unallocated — every scheduled row is already fully covered`
      : "Nothing to allocate";
  }

  const formatPeriod = (period: string) => {
    const [year, m] = period.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const monthIdx = Number(m) - 1;
    return `${months[monthIdx] ?? m} ${year}`;
  };

  const parts = plan.rows.map((r) => {
    const tag = r.status === "partial" ? " partial" : "";
    return `${formatPeriod(r.period)} (R${r.amountApplied.toLocaleString("en-ZA")}${tag})`;
  });
  let summary = parts.join(" + ");
  if (plan.remainder > 0) {
    summary += ` · R${plan.remainder.toLocaleString("en-ZA")} unallocated`;
  }
  return summary;
}
