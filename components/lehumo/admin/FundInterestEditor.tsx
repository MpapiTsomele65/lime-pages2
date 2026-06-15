"use client";

/**
 * FundInterestEditor — admin input for the cumulative pool interest
 * earned, shown on the member dashboard's Interest Earned tile + pool
 * chart. Writes the Interest Earned field on the Fund Settings
 * singleton via adminUpdateFundInterest (independent of the allocation
 * save on the same page).
 *
 * Replaces the old Vercel-env workflow (LEHUMO_INTEREST_EARNED_ZAR).
 */

import { useState } from "react";
import { Check, Loader2, TrendingUp } from "lucide-react";

import { adminUpdateFundInterest } from "@/app/lehumo/portal/admin/actions";

interface FundInterestEditorProps {
  initial: number;
}

export function FundInterestEditor({ initial }: FundInterestEditorProps) {
  const [value, setValue] = useState<string>(
    initial > 0 ? String(initial) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const num = value === "" ? 0 : Number(value);
  const valid = Number.isFinite(num) && num >= 0;
  const changed = num !== initial;
  const canSave = !busy && valid && changed;

  async function handleSave() {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const res = await adminUpdateFundInterest({ interestEarned: num });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-7"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
          "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
          "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B8FF00]/15 text-[#0B7A3B]">
          <TrendingUp className="h-4 w-4" />
        </div>
        <h2 className="text-[17px] font-semibold tracking-tight text-[#0B0B0B]">
          Pool interest earned
        </h2>
      </div>
      <p className="text-sm text-[#6B7280] mb-4">
        Cumulative interest earned on the pool to date. Drives the member
        dashboard&rsquo;s <strong>Interest Earned</strong> tile and the pool
        balance chart.
      </p>

      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
        Total interest earned to date
      </label>
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF] pointer-events-none">
            R
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setSavedAt(null);
            }}
            placeholder="0.00"
            className="w-48 rounded-lg border border-[#E5E7EB] bg-white pl-7 pr-3 py-2 text-sm text-[#0B1933] tabular-nums outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex items-center gap-2 rounded-full bg-[#0B1933] px-5 py-2 text-sm font-bold text-[#B8FF00] hover:bg-[#0B1933]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </button>
        {savedAt && !error && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#0B7A3B]">
            <Check className="h-4 w-4" />
            Saved {savedAt}
          </span>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="mt-4 text-[11px] text-[#9CA3AF]">
        Updates publish to members on their next dashboard load (cached up to
        a minute). The total is spread across elapsed months to draw the pool
        chart curve.
      </p>
    </section>
  );
}
