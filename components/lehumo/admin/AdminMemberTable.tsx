"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Check,
  Loader2,
  Lock,
  Search,
  X,
  HeartHandshake,
  HandCoins,
  AlertTriangle,
} from "lucide-react";

import {
  MEMBER_STATUS,
  KYC_STATUS,
  formatMemberNumber,
  hasBeneficiary,
  computeEmergencyAccess,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
} from "@/lib/definitions";
import {
  adminClearMemberPassword,
  adminSetMemberBeneficiary,
  updateMemberKyc,
  updateMemberStatus,
  type AdminActionResult,
} from "@/app/lehumo/portal/admin/actions";
import { BeneficiaryDialog } from "@/components/lehumo/admin/BeneficiaryDialog";

interface AdminMemberTableProps {
  /** Live member list, owned by the parent AdminMembersClient
   *  wrapper so row-level actions (status changes, KYC flips,
   *  beneficiary edits, password clears) update the table inline
   *  without a refetch. */
  members: LehumoMember[];
  /** Single setter from the wrapper. Call with the freshly-PATCHed
   *  member returned from any admin server action; the wrapper
   *  splices it into the shared array by id. */
  onMemberUpdate: (updated: LehumoMember) => void;
}

export function AdminMemberTable({
  members,
  onMemberUpdate,
}: AdminMemberTableProps) {
  const [query, setQuery] = useState("");
  // "Missing beneficiary only" filter — surfaces members an admin needs to
  // chase up. Excludes Exited members from the missing set since their
  // next-of-kin is no longer relevant.
  const [missingBeneficiaryOnly, setMissingBeneficiaryOnly] = useState(false);
  // "Active loans only" filter — surfaces members currently holding an
  // emergency-access draw. Admins use this to chase repayments and to
  // sense-check who's borrowing in any given month.
  const [activeLoansOnly, setActiveLoansOnly] = useState(false);
  // "Password protected only" filter — sister to the two above.
  // Surfaces the cohort that's opted in to the optional password
  // layer. Useful for adoption tracking ("who do I still need to
  // nudge?") and as a sanity check before admin actions (e.g. before
  // clearing someone's password, see at a glance who else has one
  // set so you can pattern-spot if multiple clears get requested).
  const [passwordProtectedOnly, setPasswordProtectedOnly] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Beneficiary dialog state — null when closed; member object when
  // open (so the dialog can pre-fill from the row's current values).
  const [beneficiaryEditing, setBeneficiaryEditing] =
    useState<LehumoMember | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = members;
    if (q) {
      rows = rows.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          formatMemberNumber(m.memberNumber).toLowerCase().includes(q),
      );
    }
    if (missingBeneficiaryOnly) {
      rows = rows.filter((m) => m.status !== "Exited" && !hasBeneficiary(m));
    }
    if (activeLoansOnly) {
      rows = rows.filter((m) => (m.activeLoanBalance ?? 0) > 0);
    }
    if (passwordProtectedOnly) {
      rows = rows.filter((m) => Boolean(m.passwordHash));
    }

    // Sort by member completeness so the most active + fully set-up
    // members float to the top and non-active members sink to the
    // bottom. Three-level comparison:
    //   1. Status tier — Active first, Exited last.
    //   2. Completeness score — KYC Complete (+2) + Beneficiary (+1).
    //      Higher score = higher in the list within the same tier.
    //   3. Alphabetical name — stable tiebreaker.
    const STATUS_TIER: Record<string, number> = {
      [MEMBER_STATUS.active]:     0,
      [MEMBER_STATUS.onHold]:     1,
      [MEMBER_STATUS.onboarding]: 2,
      [MEMBER_STATUS.prospect]:   3,
      [MEMBER_STATUS.exited]:     4,
    };
    const completenessScore = (m: (typeof rows)[number]) =>
      (m.kycStatus === KYC_STATUS.complete ? 2 : 0) +
      (hasBeneficiary(m) ? 1 : 0);

    rows = [...rows].sort((a, b) => {
      const tierDiff = (STATUS_TIER[a.status] ?? 99) - (STATUS_TIER[b.status] ?? 99);
      if (tierDiff !== 0) return tierDiff;
      const scoreDiff = completenessScore(b) - completenessScore(a); // higher score first
      if (scoreDiff !== 0) return scoreDiff;
      return a.fullName.localeCompare(b.fullName);
    });

    return rows;
  }, [
    members,
    query,
    missingBeneficiaryOnly,
    activeLoansOnly,
    passwordProtectedOnly,
  ]);

  async function runAction(
    key: string,
    action: () => Promise<AdminActionResult>,
  ) {
    setBusyKey(key);
    setError(null);
    try {
      const res = await action();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onMemberUpdate(res.member);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_2px_0_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.05)]">
      {/* Toolbar — soft gradient hairline at the bottom replaces the
          hard E5E7EB rule. Section header tightened to match the
          portal's tracking-tight typography. */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 px-6 py-5">
        <h2 className="text-[17px] font-semibold tracking-tight text-[#0B0B0B]">
          Members
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Missing-beneficiary filter — toggle pill. Active state mirrors
              the lime accent we use on dashboard CTAs so admins can spot
              that the table is filtered at a glance. */}
          <button
            type="button"
            onClick={() => setMissingBeneficiaryOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              missingBeneficiaryOnly
                ? "border-[#0B1933]/30 bg-[#0B1933] text-[#B8FF00] hover:bg-[#0B1933]/90"
                : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933]"
            }`}
            title="Show only non-exited members without a beneficiary on file"
          >
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>
              {missingBeneficiaryOnly ? "Missing beneficiary" : "Missing beneficiary"}
            </span>
            {missingBeneficiaryOnly && (
              <X className="h-3 w-3 ml-0.5 opacity-70" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveLoansOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              activeLoansOnly
                ? "border-[#0B1933]/30 bg-[#0B1933] text-[#46CDCF] hover:bg-[#0B1933]/90"
                : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933]"
            }`}
            title="Show only members with an active emergency-access loan"
          >
            <HandCoins className="h-3.5 w-3.5" />
            <span>Active loans</span>
            {activeLoansOnly && <X className="h-3 w-3 ml-0.5 opacity-70" />}
          </button>

          {/* Password-protected filter — same toggle pattern; active
              state uses the lime accent that matches the per-row
              "Password set" chip so the cohort, the filter, and the
              chips all read as one visual system. */}
          <button
            type="button"
            onClick={() => setPasswordProtectedOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              passwordProtectedOnly
                ? "border-[#0B1933]/30 bg-[#0B1933] text-[#B8FF00] hover:bg-[#0B1933]/90"
                : "border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933]"
            }`}
            title="Show only members who have opted in to the optional password layer"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Password protected</span>
            {passwordProtectedOnly && (
              <X className="h-3 w-3 ml-0.5 opacity-70" />
            )}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search name, email or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-72 rounded-full bg-white border border-[#E5E7EB] pl-9 pr-3 py-2 text-sm text-[#0B0B0B] placeholder:text-[#9CA3AF] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/10 transition-colors"
            />
          </div>
        </div>
        {/* Soft gradient hairline replacing the harsh border-b */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[#6B7280] bg-[#F8F9FA]">
              <th className="sticky left-0 z-10 bg-[#F8F9FA] px-4 py-3 font-medium min-w-[200px]">
                Member
              </th>
              <th className="px-3 py-3 font-medium min-w-[140px]">Status</th>
              <th className="px-3 py-3 font-medium min-w-[140px]">KYC</th>
              <th className="px-3 py-3 font-medium min-w-[110px]">Beneficiary</th>
              <th className="px-3 py-3 font-medium min-w-[110px]">Plan</th>
              <th className="px-3 py-3 font-medium min-w-[120px]">
                Active Loan
              </th>
              <th className="px-3 py-3 font-medium min-w-[130px]">
                Risk Profile
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="border-t border-[#E5E7EB] hover:bg-[#F8F9FA]/60"
              >
                {/* Member name + id + per-row affordances. The
                    "Contributions" chip deep-links to the dedicated
                    Contributions page pre-filtered to this member —
                    that's where EFT logging + per-period status edits
                    + reconciliation live now. Drilling into a member's
                    money flow is one click without making the Members
                    table 17 columns wide. */}
                <td className="sticky left-0 z-10 bg-white px-4 py-3">
                  <div className="font-medium text-[#0B0B0B]">
                    {m.fullName || "—"}
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    {formatMemberNumber(m.memberNumber)} · {m.email || "no email"}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/lehumo/portal/admin/contributions?member=${m.id}`}
                      className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-2 py-0.5 text-[10.5px] font-medium text-[#6B7280] hover:border-[#0B1933]/30 hover:text-[#0B1933] transition-colors"
                      title={`View ${m.fullName || "this member"}'s contributions`}
                    >
                      <Banknote className="h-3 w-3" />
                      Contributions
                    </Link>
                    {/* Password chip — only when the member has opted
                        in to the optional password layer. Click → confirm
                        → server clears the PwHash segment from notes,
                        returning the member to email + member-number
                        sign-in. Used when a member's both forgotten
                        their password AND can't access their email. */}
                    {m.passwordHash && (
                      <PasswordChip
                        member={m}
                        busy={busyKey === `${m.id}:pw-clear`}
                        onClear={() =>
                          runAction(`${m.id}:pw-clear`, () =>
                            adminClearMemberPassword(m.id),
                          )
                        }
                      />
                    )}
                  </div>
                </td>

                {/* Status dropdown — colour-coded so admins can scan
                    distribution at a glance. Mapping:
                      Active → lime (the goal state)
                      Onboarding → teal (in progress)
                      On Hold → amber (needs attention)
                      Exited → muted red (left the program)
                      Prospect → grey neutral (default, low-signal) */}
                <td className="px-3 py-3">
                  <SelectCell
                    value={m.status}
                    options={Object.values(MEMBER_STATUS)}
                    busy={busyKey === `${m.id}:status`}
                    colorClassFor={statusColorClass}
                    onChange={(v) =>
                      runAction(`${m.id}:status`, () =>
                        updateMemberStatus(m.id, v as MemberStatus),
                      )
                    }
                  />
                </td>

                {/* KYC dropdown — colour-coded mirror of the status
                    column. Mapping:
                      Complete → lime (verified)
                      In Progress → teal (admin reviewing)
                      Docs Requested → amber (waiting on member)
                      Not Started → grey neutral (default state) */}
                <td className="px-3 py-3">
                  <SelectCell
                    value={m.kycStatus}
                    options={Object.values(KYC_STATUS)}
                    busy={busyKey === `${m.id}:kyc`}
                    colorClassFor={kycColorClass}
                    onChange={(v) =>
                      runAction(`${m.id}:kyc`, () =>
                        updateMemberKyc(m.id, v as KycStatus),
                      )
                    }
                  />
                </td>

                {/* Beneficiary cell — now clickable. When a beneficiary
                    is on file: shows name + relationship inline +
                    "Updated" date as subtitle. Click to open the
                    edit dialog. When empty: shows an "Add" button
                    that opens the dialog blank. The admin-on-behalf
                    write path fires through adminSetMemberBeneficiary. */}
                <td className="px-3 py-3">
                  <BeneficiaryCell
                    member={m}
                    onEdit={() => setBeneficiaryEditing(m)}
                  />
                </td>

                {/* Plan ticker — shows the member's chosen contribution
                    plan (Basic / Standard / VIP) so admins know which
                    payment ceremony applies (manual EFT vs auto-debit)
                    when reconciling or chasing up. Colour-coded for
                    quick scanning. The Cancel-Pending state from the
                    subscription action layers on top as a small badge
                    so admins see both "what plan" and "what's pending"
                    in one cell. */}
                <td className="px-3 py-3">
                  <PlanCell member={m} />
                </td>

                {/* Active loan indicator — surfaces outstanding balance,
                    type (Self vs P2P) and overdue state if applicable.
                    Read-only here; loan issue/repay flows live in
                    Airtable for v1 (admin updates the three loan
                    columns directly). */}
                <td className="px-3 py-3">
                  <LoanCell member={m} />
                </td>
                <td className="px-3 py-3">
                  <RiskCell member={m} />
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-[#9CA3AF]"
                >
                  {activeLoansOnly && !query.trim() && !missingBeneficiaryOnly
                    ? "No active emergency-access loans on the books right now."
                    : missingBeneficiaryOnly && !query.trim()
                      ? "Every non-exited member has a beneficiary on file. Nice."
                      : `No members match \u201C${query}\u201D.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Beneficiary edit / add dialog — single instance at the table
          root. Cell click sets `beneficiaryEditing` to the member
          object; onSubmit fires the admin server action and (on
          success) merges the returned member into local state so the
          row re-renders with the new beneficiary inline. */}
      <BeneficiaryDialog
        member={beneficiaryEditing}
        onSubmit={async (member, fields) => {
          const res = await adminSetMemberBeneficiary(member.id, fields);
          if (!res.ok) {
            return { ok: false, error: res.error };
          }
          onMemberUpdate(res.member);
          setBeneficiaryEditing(null);
          return { ok: true };
        }}
        onCancel={() => setBeneficiaryEditing(null)}
      />

    </section>
  );
}

/**
 * Beneficiary indicator + click-to-edit affordance for the admin
 * table.
 *
 * Two states:
 *   - On file → lime pill showing the beneficiary's name +
 *     relationship inline, with "Updated DD MMM" subtitle and a
 *     pencil affordance. Click anywhere on the cell opens the edit
 *     dialog pre-filled with the existing values.
 *   - Empty → muted dashed "Add" button. Click opens the dialog
 *     blank for an admin-on-behalf entry (member emailed in their
 *     next-of-kin, etc).
 *
 * The cell renders the same content for both states so the column
 * width is stable regardless of populated/empty mix on screen.
 */
function BeneficiaryCell({
  member,
  onEdit,
}: {
  member: LehumoMember;
  onEdit: () => void;
}) {
  const onFile = hasBeneficiary(member);

  if (!onFile) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#E5E7EB] px-2 py-0.5 text-[11px] text-[#9CA3AF] hover:border-[#B8FF00]/50 hover:text-[#0B1933] hover:bg-[#B8FF00]/10 transition-colors"
        title="Click to add the member's next-of-kin on their behalf"
      >
        + Add
      </button>
    );
  }

  const fullName =
    `${member.beneficiaryFirstName ?? ""} ${member.beneficiarySurname ?? ""}`.trim() ||
    "—";
  const tooltipParts = [
    fullName,
    member.beneficiaryRelationship || null,
    member.beneficiaryPhone ? `📞 ${member.beneficiaryPhone}` : null,
    member.beneficiaryEmail ? `✉ ${member.beneficiaryEmail}` : null,
    member.beneficiaryUpdatedAt ? `Updated ${member.beneficiaryUpdatedAt}` : null,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group inline-flex max-w-full flex-col items-start rounded-lg border border-transparent px-2 py-1 text-left hover:bg-[#B8FF00]/[0.08] hover:border-[#B8FF00]/30 transition-colors"
      title={tooltipParts.join(" · ")}
    >
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B1933]">
        <Check className="h-3 w-3 text-[#0B1933]" />
        <span className="truncate max-w-[140px]">{fullName}</span>
        {member.beneficiaryRelationship && (
          <span className="text-[10px] font-medium text-[#6B7280]">
            · {member.beneficiaryRelationship}
          </span>
        )}
      </span>
      {member.beneficiaryUpdatedAt && (
        <span className="text-[10px] text-[#9CA3AF] mt-0.5">
          Updated {member.beneficiaryUpdatedAt}
        </span>
      )}
    </button>
  );
}

/**
 * Read-only emergency-access loan indicator for the admin table.
 *
 * Renders a muted "—" pill when the member has no active loan, otherwise a
 * teal pill with the outstanding ZAR amount and a small Self / P2P type
 * chip. If the helper flags the loan as past the 90-day repayment window,
 * the pill flips to a red overdue variant with a warning glyph so admins
 * can prioritise chase-ups at a glance.
 *
 * Stays read-only here — issue / repay flows happen in Airtable directly
 * for v1; the dashboard is just a window onto the lending ledger.
 */
function LoanCell({ member }: { member: LehumoMember }) {
  const balance = member.activeLoanBalance ?? 0;
  if (balance <= 0) {
    return (
      <span
        className="inline-flex items-center rounded-full border border-dashed border-[#E5E7EB] px-2 py-0.5 text-[11px] text-[#9CA3AF]"
        title="No active emergency-access loan"
      >
        —
      </span>
    );
  }

  // Defensive: balance > 0 but the helper hasn't reached "active-loan"
  // (e.g. corrupt data with balance set but no issue date) — still show
  // the balance, just skip the issue/due/overdue signals that depend on
  // the helper's full state.
  const access = computeEmergencyAccess(member);
  const isActive = access.kind === "active-loan";
  const overdue = isActive && access.isOverdue;
  const loanType = isActive ? access.loanType : member.activeLoanType || "";

  const tooltipParts: string[] = [
    `R ${balance.toLocaleString("en-ZA")} outstanding`,
  ];
  if (isActive) {
    tooltipParts.push(`Issued ${access.issuedAt}`);
    tooltipParts.push(`Due ${access.dueAt}`);
    if (access.isOverdue) tooltipParts.push("Past 90-day window");
  }

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          overdue
            ? "border border-red-200 bg-red-50 text-red-700"
            : "bg-[#46CDCF]/15 text-[#0B1933]"
        }`}
        title={tooltipParts.join(" · ")}
      >
        {overdue && <AlertTriangle className="h-3 w-3" />}
        R {balance.toLocaleString("en-ZA")}
      </span>
      {loanType && (
        <span className="rounded border border-[#E5E7EB] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[#6B7280]">
          {loanType}
        </span>
      )}
    </div>
  );
}

/**
 * Plan ticker — at-a-glance indicator of which contribution plan each
 * member is on. Drives admin workflow: Standard members are on auto-
 * debit (Paystack handles the monthly charge); Basic members pay
 * manually via EFT (admin needs to log via the Log EFT modal); VIP is
 * coming-soon.
 *
 * Layers two pieces of state into one cell:
 *   1. Plan tier (Basic / Standard / VIP) — colour-coded pill
 *   2. "Cancel pending" badge — small amber tag when the member has
 *      downgraded but their Paystack subscription hasn't been cancelled
 *      yet. Pairs with the AdminPendingActions surface at the top of
 *      the dashboard so admins see the signal twice and aren't likely
 *      to miss it before the next billing cycle.
 */
function PlanCell({ member }: { member: LehumoMember }) {
  const plan = member.plan;
  const hasCancelPending = member.subscriptionAction === "Cancel Pending";

  if (!plan) {
    return (
      <span
        className="inline-flex items-center rounded-full border border-dashed border-[#E5E7EB] px-2 py-0.5 text-[11px] text-[#9CA3AF]"
        title="No plan recorded — likely an early onboard before plan capture landed"
      >
        —
      </span>
    );
  }

  // Plan-specific styling + descriptive tooltip so an admin hovering
  // gets the "what does this mean operationally?" context.
  const planMeta = {
    basic: {
      label: "Basic",
      classes:
        "bg-[#46CDCF]/12 border-[#46CDCF]/30 text-[#0E7C8A]",
      tooltip: "Manual EFT · R1,000/month · Admin reconciles deposits",
    },
    standard: {
      label: "Standard",
      classes: "bg-[#B8FF00]/15 border-[#B8FF00]/35 text-[#3F5A00]",
      tooltip: "Paystack auto-debit · R1,035/month (R1,000 + 3.5% fee — covers Paystack collection cost)",
    },
    vip: {
      label: "VIP",
      classes: "bg-[#F59E0B]/12 border-[#F59E0B]/30 text-[#92400E]",
      tooltip: "VIP · R1,050/month (R1,000 + 5% fee) · Coming soon",
    },
  }[plan];

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${planMeta.classes}`}
        title={planMeta.tooltip}
      >
        {planMeta.label}
      </span>
      {hasCancelPending && (
        <span
          className="inline-flex w-fit items-center gap-1 rounded-full border border-[#F59E0B]/35 bg-[#FFFBEB] px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-[#B45309]"
          title="Member downgraded but Paystack auto-debit needs cancelling — see the Pending Actions card at the top of the dashboard"
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          Cancel pending
        </span>
      )}
    </div>
  );
}

/**
 * Password chip — visible only when the member has opted in to the
 * optional password layer (`member.passwordHash` is truthy).
 *
 * Idle state: a quiet lime chip ("Password set") so admin can see at a
 * glance who's protected. Hovering surfaces the "Clear" affordance,
 * which expands to a two-step confirm (so a stray click on a busy
 * table can't accidentally lock a member out).
 *
 * Confirm copy is deliberately explicit about the consequence so the
 * admin always knows what they're agreeing to: clearing the hash
 * returns the member to the legacy email + member-number sign-in
 * path. Used when a member's both lost their password AND their email
 * — the magic-link reset can't help in that case.
 */
function PasswordChip({
  member,
  busy,
  onClear,
}: {
  member: LehumoMember;
  busy: boolean;
  onClear: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (busy) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#B8FF00]/30 bg-[#B8FF00]/10 px-2 py-0.5 text-[10.5px] font-medium text-[#0B1933]">
        <Loader2 className="h-3 w-3 animate-spin" />
        Clearing…
      </span>
    );
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10.5px] font-medium text-red-800">
        <AlertTriangle className="h-3 w-3" />
        Clear password?
        <button
          type="button"
          onClick={onClear}
          className="ml-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-700 transition-colors"
          title={`Clear ${member.fullName}'s password — they'll sign in with their member number until they set a new one.`}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-full border border-red-200 bg-white px-2 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-50 transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 rounded-full border border-[#B8FF00]/40 bg-[#B8FF00]/10 px-2 py-0.5 text-[10.5px] font-medium text-[#0B1933] hover:bg-[#B8FF00]/20 transition-colors"
      title={`${member.fullName} has set a portal password. Click to clear it (only if they're locked out and can't use the email reset link).`}
    >
      <Lock className="h-3 w-3" />
      Password set
    </button>
  );
}

/**
 * Member-status colour mapping. The admin scan-bar use-case wants a
 * fast read on each member's lifecycle position — green = goal,
 * teal = in motion, amber = blocked, red = ended, grey = baseline.
 *
 * Tailwind classes only; falls through to the neutral grey for any
 * value Airtable might surface that we don't have a mapping for
 * (defensive against schema drift).
 */
function statusColorClass(value: string): string {
  switch (value) {
    case "Active":
      return "bg-[#B8FF00]/20 border-[#B8FF00]/50 text-[#0B1933]";
    case "Onboarding":
      return "bg-[#46CDCF]/15 border-[#46CDCF]/40 text-[#0B1933]";
    case "On Hold":
      return "bg-[#FEF3C7] border-[#F59E0B]/40 text-[#92400E]";
    case "Exited":
      return "bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]";
    case "Prospect":
    default:
      return "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280]";
  }
}

/**
 * KYC-status colour mapping. Mirrors the verified-pill scheme used in
 * AdminKycReviewSection so the same colour reads consistently across
 * the dashboard:
 *   Complete → lime (verified)
 *   In Progress → teal (under admin review)
 *   Docs Requested → amber (waiting on member action)
 *   Not Started → grey neutral (default; expected for new prospects)
 */
function kycColorClass(value: string): string {
  switch (value) {
    case "Complete":
      return "bg-[#B8FF00]/20 border-[#B8FF00]/50 text-[#0B1933]";
    case "In Progress":
      return "bg-[#46CDCF]/15 border-[#46CDCF]/40 text-[#0B1933]";
    case "Docs Requested":
      return "bg-[#FEF3C7] border-[#F59E0B]/40 text-[#92400E]";
    case "Not Started":
    default:
      return "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280]";
  }
}

function SelectCell({
  value,
  options,
  busy,
  colorClassFor,
  onChange,
}: {
  value: string;
  options: string[];
  busy: boolean;
  /** Optional value→Tailwind-class mapper. When provided, the select's
   *  background / border / text colour reflects the current value so
   *  admins can scan a column for distribution at a glance. Without
   *  this prop the cell renders the original neutral white style. */
  colorClassFor?: (value: string) => string;
  onChange: (v: string) => void;
}) {
  const colorClass =
    colorClassFor?.(value) ?? "bg-white border-[#E5E7EB] text-[#0B0B0B]";
  return (
    <div className="relative">
      <select
        value={value}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-lg border pl-3 pr-8 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-[#0B1933]/10 disabled:opacity-50 transition-colors ${colorClass}`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-white text-[#0B0B0B]">
            {opt}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#6B7280]">
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <span className="text-[10px]">▾</span>
        )}
      </div>
    </div>
  );
}

/**
 * Risk-profile colour mapping for the admin Members table. Income-leaning
 * tiers read teal, balanced reads indigo, growth-leaning reads lime —
 * mirroring the income → growth spectrum the member quiz surfaces.
 */
const RISK_TONE: Record<string, string> = {
  Conservative: "bg-[#46CDCF]/12 border-[#46CDCF]/40 text-[#0E7490]",
  Cautious: "bg-[#46CDCF]/12 border-[#46CDCF]/40 text-[#0E7490]",
  Moderate: "bg-[#6366F1]/10 border-[#6366F1]/35 text-[#4338CA]",
  "Moderate-Aggressive": "bg-[#84CC16]/15 border-[#84CC16]/45 text-[#3F6212]",
  Aggressive: "bg-[#84CC16]/15 border-[#84CC16]/45 text-[#3F6212]",
};

/**
 * Risk-profile cell — shows the member's self-assessed investor profile
 * (set via the portal quiz) as a colour-coded badge, with the assessed
 * date beneath. "Not taken" when the member hasn't completed it yet.
 */
function RiskCell({ member }: { member: LehumoMember }) {
  const profile = member.riskProfile;
  if (!profile) {
    return <span className="text-[11px] text-[#9CA3AF]">Not taken</span>;
  }
  const tone =
    RISK_TONE[profile] ?? "bg-[#F8F9FA] border-[#E5E7EB] text-[#6B7280]";
  return (
    <div>
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}
      >
        {profile}
      </span>
      {member.riskAssessed && (
        <div className="mt-1 text-[10px] text-[#9CA3AF]">
          {member.riskAssessed}
        </div>
      )}
      {(member.wealthPreference || member.preferredAssetClass) && (
        <div className="mt-1 text-[10px] text-[#6B7280] leading-tight">
          {[member.wealthPreference, member.preferredAssetClass]
            .filter(Boolean)
            .join(" · ")}
        </div>
      )}
    </div>
  );
}
