"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Search, X } from "lucide-react";

import {
  MONTH_NAMES,
  MEMBER_STATUS,
  KYC_STATUS,
  formatMemberNumber,
  type LehumoMember,
  type MemberStatus,
  type KycStatus,
} from "@/lib/definitions";
import {
  toggleMonthPayment,
  updateMemberKyc,
  updateMemberStatus,
  type AdminActionResult,
} from "@/app/lehumo/portal/admin/actions";

interface AdminMemberTableProps {
  initialMembers: LehumoMember[];
  currentMonth: string;
}

export function AdminMemberTable({
  initialMembers,
  currentMonth,
}: AdminMemberTableProps) {
  const [members, setMembers] = useState<LehumoMember[]>(initialMembers);
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        formatMemberNumber(m.memberNumber).toLowerCase().includes(q),
    );
  }, [members, query]);

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
      const updated = res.member;
      startTransition(() => {
        setMembers((prev) =>
          prev.map((m) => (m.id === updated.id ? updated : m)),
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="rounded-[20px] border border-[#E5E7EB] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
        <h2 className="text-lg font-semibold text-[#0B0B0B]">Members</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search name, email or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-72 rounded-full bg-white border border-[#E5E7EB] pl-9 pr-3 py-2 text-sm text-[#0B0B0B] placeholder:text-[#9CA3AF] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/10"
          />
        </div>
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
              {MONTH_NAMES.map((m) => (
                <th
                  key={m}
                  className={`px-2 py-3 font-medium text-center w-12 ${
                    m === currentMonth ? "text-[#0B1933] bg-[#B8FF00]/20" : ""
                  }`}
                >
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="border-t border-[#E5E7EB] hover:bg-[#F8F9FA]/60"
              >
                {/* Member name + id */}
                <td className="sticky left-0 z-10 bg-white px-4 py-3">
                  <div className="font-medium text-[#0B0B0B]">
                    {m.fullName || "—"}
                  </div>
                  <div className="text-xs text-[#6B7280]">
                    {formatMemberNumber(m.memberNumber)} · {m.email || "no email"}
                  </div>
                </td>

                {/* Status dropdown */}
                <td className="px-3 py-3">
                  <SelectCell
                    value={m.status}
                    options={Object.values(MEMBER_STATUS)}
                    busy={busyKey === `${m.id}:status`}
                    onChange={(v) =>
                      runAction(`${m.id}:status`, () =>
                        updateMemberStatus(m.id, v as MemberStatus),
                      )
                    }
                  />
                </td>

                {/* KYC dropdown */}
                <td className="px-3 py-3">
                  <SelectCell
                    value={m.kycStatus}
                    options={Object.values(KYC_STATUS)}
                    busy={busyKey === `${m.id}:kyc`}
                    onChange={(v) =>
                      runAction(`${m.id}:kyc`, () =>
                        updateMemberKyc(m.id, v as KycStatus),
                      )
                    }
                  />
                </td>

                {/* Month toggle cells */}
                {MONTH_NAMES.map((month) => {
                  const paid = m.contributions[month];
                  const key = `${m.id}:${month}`;
                  const isBusy = busyKey === key;
                  return (
                    <td key={month} className="px-2 py-3 text-center">
                      <button
                        onClick={() =>
                          runAction(key, () =>
                            toggleMonthPayment(m.id, month, !paid),
                          )
                        }
                        disabled={isBusy}
                        title={`${m.fullName} — ${month}: ${paid ? "paid" : "unpaid"} (click to toggle)`}
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-50 ${
                          paid
                            ? "bg-[#B8FF00] border-[#0B1933]/20 text-[#0B1933] hover:bg-[#a8ef00]"
                            : "bg-white border-[#E5E7EB] text-[#9CA3AF] hover:border-[#0B1933]/40 hover:text-[#0B1933]"
                        }`}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : paid ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <X className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={3 + MONTH_NAMES.length}
                  className="px-4 py-12 text-center text-sm text-[#9CA3AF]"
                >
                  No members match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SelectCell({
  value,
  options,
  busy,
  onChange,
}: {
  value: string;
  options: string[];
  busy: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={busy}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg bg-white border border-[#E5E7EB] pl-3 pr-8 py-1.5 text-xs text-[#0B0B0B] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/10 disabled:opacity-50"
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
