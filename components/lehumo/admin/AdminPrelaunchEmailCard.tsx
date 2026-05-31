"use client";

import { useState } from "react";
import {
  Loader2,
  Mail,
  Send,
  AlertTriangle,
  CheckCircle2,
  Eye,
  ShieldAlert,
} from "lucide-react";

/**
 * Pre-launch broadcast control panel for the admin page.
 *
 * Three actions:
 *   1. Preview — opens the live-rendered email in a new tab (GET handler)
 *   2. Test send — POSTs `{ mode: "test", testTo: <input> }`, default
 *      to the admin's own email; shows the response inline
 *   3. Broadcast — POSTs `{ mode: "broadcast", expectedCount }` after
 *      a confirm dialog where the admin re-types the expected count
 *      (must match the live recipient count, server-enforced)
 *
 * The preview button is the safest action (no send). The test button
 * lets the admin verify rendering + delivery in their own inbox.
 * Broadcast is gated behind a typed-confirm so a stray click can't
 * blast 30+ recipients.
 *
 * All three call /api/lehumo/admin/prelaunch-email which is admin-
 * gated server-side, so this card is safe to render unconditionally
 * on the admin page — non-admins can't actually trigger anything.
 */
export function AdminPrelaunchEmailCard({
  defaultTestEmail,
}: {
  /** Admin's email from their session — pre-fills the test input. */
  defaultTestEmail: string;
}) {
  const [testTo, setTestTo] = useState(defaultTestEmail);
  const [busy, setBusy] = useState<"test" | "preview" | "broadcast" | null>(
    null,
  );
  // Last action's response surface — string for human-readable status,
  // separate `kind` so the UI can colour-code success vs error.
  const [result, setResult] = useState<{
    kind: "success" | "error";
    title: string;
    detail?: string;
  } | null>(null);

  // Broadcast confirmation: load the preview first to surface the
  // live recipient count, ask the admin to type it back, then fire
  // the broadcast with that count as the safety key.
  const [previewData, setPreviewData] = useState<{
    recipientCount: number;
    breakdown: { members: number; leads: number };
  } | null>(null);
  const [typedCount, setTypedCount] = useState("");

  async function loadPreviewData() {
    setBusy("broadcast");
    setResult(null);
    try {
      const res = await fetch("/api/lehumo/admin/prelaunch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "preview" }),
      });
      const body = await res.json();
      if (!res.ok) {
        setResult({
          kind: "error",
          title: `Couldn't load recipient list (${res.status})`,
          detail: body?.error ?? "Unknown error",
        });
        setBusy(null);
        return;
      }
      setPreviewData({
        recipientCount: body.recipientCount,
        breakdown: body.breakdown,
      });
      setTypedCount("");
    } catch (err) {
      setResult({
        kind: "error",
        title: "Network error loading preview",
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(null);
    }
  }

  async function fireTestSend() {
    if (!testTo.trim()) {
      setResult({ kind: "error", title: "Enter a recipient email first." });
      return;
    }
    setBusy("test");
    setResult(null);
    try {
      const res = await fetch("/api/lehumo/admin/prelaunch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "test", testTo: testTo.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setResult({
          kind: "error",
          title: `Test send failed (HTTP ${res.status})`,
          detail: `${body?.errorClass ? `[${body.errorClass}] ` : ""}${body?.error ?? "Unknown error"}${body?.reqId ? ` · ref ${body.reqId}` : ""}`,
        });
        return;
      }
      setResult({
        kind: "success",
        title: `Test email queued for ${body.sentTo ?? testTo}`,
        detail: `Resend accepted the request${body.reqId ? ` (ref ${body.reqId})` : ""}. Check the inbox + the lehumo@ BCC. If it doesn't arrive in 60s, check Resend dashboard logs.`,
      });
    } catch (err) {
      setResult({
        kind: "error",
        title: "Network error firing test",
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(null);
    }
  }

  async function fireBroadcast() {
    if (!previewData) return;
    const expected = Number(typedCount);
    if (!Number.isFinite(expected) || expected !== previewData.recipientCount) {
      setResult({
        kind: "error",
        title: "Typed count doesn't match.",
        detail: `Type ${previewData.recipientCount} exactly to confirm.`,
      });
      return;
    }
    setBusy("broadcast");
    setResult(null);
    try {
      const res = await fetch("/api/lehumo/admin/prelaunch-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "broadcast", expectedCount: expected }),
      });
      const body = await res.json();
      if (!res.ok) {
        setResult({
          kind: "error",
          title: `Broadcast failed (HTTP ${res.status})`,
          detail: body?.error ?? "Unknown error",
        });
        return;
      }
      setResult({
        kind: "success",
        title: `Broadcast complete — ${body.sentCount} of ${body.totalAttempted} delivered`,
        detail:
          body.failedCount > 0
            ? `${body.failedCount} failure(s). Check the response for details.`
            : "Zero failures. The lehumo@ BCC inbox has a copy of each.",
      });
      setPreviewData(null);
      setTypedCount("");
    } catch (err) {
      setResult({
        kind: "error",
        title: "Network error firing broadcast",
        detail: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className="rounded-[24px] border border-[#EDEDED] bg-gradient-to-b from-white to-[#FCFCFD] p-6"
      style={{
        boxShadow:
          "inset 0 1px 0 0 rgba(255, 255, 255, 0.6), " +
          "0 1px 2px 0 rgba(0, 0, 0, 0.04), " +
          "0 4px 16px -4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#0B1933]">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-tight text-[#0B0B0B]">
            Pre-launch broadcast email
          </h2>
          <p className="mt-0.5 text-[13px] text-[#6B7280] leading-relaxed">
            Preview the live email, fire a test to yourself, then
            broadcast to all members + leads (with typed-count safety).
          </p>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 ${
            result.kind === "success"
              ? "border-[#B8FF00]/40 bg-[#B8FF00]/10"
              : "border-red-300 bg-red-50"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {result.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-[#0B1933]" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-700" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-[13px] font-semibold ${result.kind === "success" ? "text-[#0B1933]" : "text-red-800"}`}
              >
                {result.title}
              </p>
              {result.detail && (
                <p
                  className={`mt-0.5 text-[12px] leading-relaxed ${result.kind === "success" ? "text-[#0B1933]/70" : "text-red-800/85"}`}
                >
                  {result.detail}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test + Preview row */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2.5 items-end">
        <div>
          <label className="block text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">
            Test recipient
          </label>
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="papi.tsomele@gmail.com"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-[#0B0B0B] placeholder:text-[#9CA3AF] outline-none focus:border-[#0B1933]/30 focus:ring-1 focus:ring-[#0B1933]/10"
            disabled={busy !== null}
          />
        </div>
        <a
          href="/api/lehumo/admin/prelaunch-email"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#0B1933] hover:bg-[#F8F9FA] transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview in new tab
        </a>
        <button
          type="button"
          onClick={fireTestSend}
          disabled={busy !== null}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0B1933] px-4 py-2 text-[13px] font-semibold text-[#B8FF00] hover:bg-[#0B1933]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {busy === "test" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              Send test
            </>
          )}
        </button>
      </div>

      {/* Broadcast control */}
      <div className="mt-6 rounded-xl border border-[#F59E0B]/25 bg-[#FEF3C7]/30 p-4">
        <div className="flex items-start gap-2.5 mb-3">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-[#92400E]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-[#92400E]">
              Broadcast to everyone
            </p>
            <p className="mt-0.5 text-[12px] text-[#92400E]/85 leading-relaxed">
              Sends the email to all Members (excluding Exited) + all
              Leads, deduped by email. Gated behind a typed-count
              confirmation so a stray click can&rsquo;t blast the cohort.
            </p>
          </div>
        </div>

        {!previewData ? (
          <button
            type="button"
            onClick={loadPreviewData}
            disabled={busy !== null}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#F59E0B]/40 bg-white px-4 py-2 text-[13px] font-semibold text-[#92400E] hover:bg-[#F59E0B]/10 disabled:opacity-50 transition-colors"
          >
            {busy === "broadcast" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </>
            ) : (
              <>Load recipient list</>
            )}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg bg-white border border-[#F59E0B]/25 px-3 py-2.5">
              <p className="text-[12px] text-[#92400E]/85">
                <strong className="text-[#0B0B0B]">
                  {previewData.recipientCount} unique recipients
                </strong>{" "}
                — {previewData.breakdown.members} members,{" "}
                {previewData.breakdown.leads} leads (deduped).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={typedCount}
                onChange={(e) => setTypedCount(e.target.value)}
                placeholder={`Type ${previewData.recipientCount} to confirm`}
                className="flex-1 rounded-lg border border-[#F59E0B]/40 bg-white px-3 py-2 text-[13px] text-[#0B0B0B] placeholder:text-[#F59E0B]/60 outline-none focus:border-[#92400E]/40 focus:ring-1 focus:ring-[#92400E]/20"
                disabled={busy !== null}
              />
              <button
                type="button"
                onClick={fireBroadcast}
                disabled={busy !== null || Number(typedCount) !== previewData.recipientCount}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#92400E] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[#7C2D12] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {busy === "broadcast" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Broadcasting…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Confirm + broadcast
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewData(null);
                  setTypedCount("");
                }}
                disabled={busy !== null}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#F59E0B]/30 bg-white px-4 py-2 text-[13px] font-medium text-[#92400E] hover:bg-[#F59E0B]/5 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
