"use client";

/**
 * FundPortfolioEditor — admin editor for the member-facing "Where is
 * our money now?" card. Edits the allocation rows (label + % + colour),
 * a strategy narrative, and an "as at" date, then persists the singleton
 * Fund Settings row via adminUpdateFundPortfolio.
 *
 * Save is blocked until the percentages sum to 100 (the donut must be
 * whole) — a live indicator shows the running total. Light-theme to
 * match the admin Settings chrome.
 */

import { useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

import {
  LEHUMO_ALLOCATION_PALETTE,
  type FundPortfolio,
  type PortfolioSlice,
} from "@/lib/definitions";
import { adminUpdateFundPortfolio } from "@/app/lehumo/portal/admin/actions";

interface FundPortfolioEditorProps {
  initial: FundPortfolio;
}

export function FundPortfolioEditor({ initial }: FundPortfolioEditorProps) {
  const [rows, setRows] = useState<PortfolioSlice[]>(() =>
    initial.allocation.map((r) => ({ ...r })),
  );
  const [strategyNote, setStrategyNote] = useState(initial.strategyNote);
  const [asAt, setAsAt] = useState(initial.asAt ?? todayIso());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const sum = rows.reduce((s, r) => s + (Number.isFinite(r.pct) ? r.pct : 0), 0);
  const sumOk = Math.abs(sum - 100) <= 0.5;
  const labelsOk = rows.every((r) => r.label.trim().length > 0);
  const canSave = !busy && sumOk && labelsOk && rows.length > 0;

  function updateRow(i: number, patch: Partial<PortfolioSlice>) {
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)),
    );
    setSavedAt(null);
  }

  function addRow() {
    const color =
      LEHUMO_ALLOCATION_PALETTE[rows.length % LEHUMO_ALLOCATION_PALETTE.length];
    setRows((prev) => [...prev, { label: "", pct: 0, color }]);
    setSavedAt(null);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    setSavedAt(null);
  }

  async function handleSave() {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      const res = await adminUpdateFundPortfolio({
        allocation: rows.map((r) => ({
          label: r.label.trim(),
          pct: r.pct,
          color: r.color,
        })),
        strategyNote,
        asAt: asAt || undefined,
      });
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
      <h2 className="text-[17px] font-semibold tracking-tight text-[#0B0B0B] mb-1">
        Portfolio allocation &amp; strategy
      </h2>
      <p className="text-sm text-[#6B7280] mb-5">
        Drives the member portal&rsquo;s &ldquo;Where is our money now?&rdquo;
        card. Percentages must sum to 100%.
      </p>

      {/* Allocation rows */}
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <input
              type="color"
              value={row.color}
              onChange={(e) => updateRow(i, { color: e.target.value })}
              className="h-9 w-9 shrink-0 rounded-lg border border-[#E5E7EB] bg-white cursor-pointer p-0.5"
              aria-label={`Colour for row ${i + 1}`}
            />
            <input
              type="text"
              value={row.label}
              onChange={(e) => updateRow(i, { label: e.target.value })}
              placeholder="Asset class (e.g. Cash Reserves)"
              maxLength={60}
              className="flex-1 min-w-0 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0B1933] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors"
            />
            <div className="relative shrink-0">
              <input
                type="number"
                value={Number.isFinite(row.pct) ? row.pct : ""}
                onChange={(e) =>
                  updateRow(i, {
                    pct: e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
                min={0}
                max={100}
                step={1}
                className="w-20 rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-6 py-2 text-sm text-[#0B1933] tabular-nums outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors"
                aria-label={`Percentage for ${row.label || `row ${i + 1}`}`}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9CA3AF] pointer-events-none">
                %
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 1}
              className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#E5E7EB] bg-white text-[#9CA3AF] hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Remove row"
              title="Remove row"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add row + sum indicator */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= 12}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#0B1933] hover:bg-[#F8F9FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add asset class
        </button>
        <span
          className={`text-[12.5px] font-semibold tabular-nums ${
            sumOk ? "text-[#0B7A3B]" : "text-orange-600"
          }`}
        >
          Total: {sum}% {sumOk ? "✓" : "(must be 100%)"}
        </span>
      </div>

      {/* Strategy note */}
      <div className="mt-6">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
          Investment strategy note
        </label>
        <textarea
          value={strategyNote}
          onChange={(e) => {
            setStrategyNote(e.target.value);
            setSavedAt(null);
          }}
          rows={5}
          maxLength={2000}
          placeholder="Explain where the money sits and why — members see this verbatim."
          className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#0B1933] leading-relaxed outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors resize-y"
        />
        <p className="mt-1 text-[11px] text-[#9CA3AF] text-right">
          {strategyNote.length}/2000
        </p>
      </div>

      {/* As-at date */}
      <div className="mt-3">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mb-1.5">
          Current as at
        </label>
        <input
          type="date"
          value={asAt}
          onChange={(e) => {
            setAsAt(e.target.value);
            setSavedAt(null);
          }}
          className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#0B1933] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/15 transition-colors"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-end gap-3">
        {savedAt && !error && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#0B7A3B]">
            <Check className="h-4 w-4" />
            Saved {savedAt}
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="inline-flex items-center gap-2 rounded-full bg-[#0B1933] px-5 py-2.5 text-sm font-bold text-[#B8FF00] hover:bg-[#0B1933]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Save & publish to members"
          )}
        </button>
      </div>
    </section>
  );
}

function todayIso(): string {
  const sastNow = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  return sastNow.slice(0, 10);
}
