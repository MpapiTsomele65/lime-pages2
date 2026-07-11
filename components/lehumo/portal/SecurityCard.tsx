"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
} from "lucide-react";

interface SecurityCardProps {
  /** True when the member already has a password set. Drives whether
   *  the card opens in "set" mode (new password only) or
   *  "change/remove" mode (current + new, or current + remove). */
  hasPassword: boolean;
  /** Pre-formatted member number (e.g. "Leh07") shown in the
   *  confirmation copy. Also used as the "weak password" signal by
   *  the server-side strength check. */
  memberNumber: string;
}

/**
 * Member-portal Security card.
 *
 * Three states:
 *   1. No password set, card collapsed → "Set up a password" CTA
 *      + plain-English explainer of what it does.
 *   2. No password set, card expanded → New password + confirm
 *      fields. Submit → POST `/api/lehumo/portal/member/password`
 *      with { current: undefined, next: "<plaintext>" }.
 *   3. Password already set → "Password is set" success row +
 *      separate Change / Remove buttons, each opening a small
 *      sub-form (current pw required for both — re-auth so a stolen
 *      session can't silently rotate or remove the credential).
 *
 * After any successful mutation we refresh the page (`location.reload`)
 * — that's the simplest way to re-fetch the server-rendered
 * `hasPassword` prop, and these flows are rare enough that the brief
 * flash is fine.
 */
export function SecurityCard({ hasPassword, memberNumber }: SecurityCardProps) {
  const [mode, setMode] = useState<"idle" | "set" | "change" | "remove">(
    "idle",
  );

  // When the card opens in the "no password yet" state, expanding into
  // the set-up form skips the idle CTA entirely. For members who
  // already have a password, the card stays in idle and shows Change /
  // Remove sub-actions instead.
  if (!hasPassword) {
    return (
      <div className="rounded-[20px] border border-white/[0.06] bg-[#0F2040] overflow-hidden">
        <div className="p-6 md:p-7">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white">
                Portal password
              </h2>
              <p className="mt-0.5 text-[12.5px] font-medium uppercase tracking-[0.12em] text-white/60">
                Not set
              </p>
            </div>
          </div>

          <p className="text-sm text-white/55 leading-relaxed mb-4">
            Right now you sign in with your email + member number ({memberNumber}).
            Member numbers are sequential, so anyone who knows your
            email could guess yours. Setting a password replaces the
            member-number step with something only you know.
          </p>

          <div className="rounded-xl bg-[#46CDCF]/[0.05] border border-[#46CDCF]/15 p-3.5 mb-5">
            <p className="text-[12.5px] text-white/65 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#46CDCF] mt-0.5" />
              <span>
                <strong className="text-white/85">
                  Once you set a password, the member-number sign-in
                  retires for your account.
                </strong>{" "}
                You&rsquo;ll sign in with email + password from then on.
                You can remove the password anytime to switch back.
              </span>
            </p>
          </div>

          <AnimatePresence initial={false} mode="wait">
            {mode === "idle" ? (
              <motion.button
                key="cta"
                type="button"
                onClick={() => setMode("set")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#B8FF00] px-5 py-2.5 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                Set up a password
              </motion.button>
            ) : (
              <motion.div
                key="setform"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden" }}
              >
                <PasswordForm
                  mode="set"
                  memberNumber={memberNumber}
                  onCancel={() => setMode("idle")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Password is set — Change / Remove sub-actions. ──────────────
  return (
    <div className="rounded-[20px] border border-white/[0.06] bg-[#0F2040] overflow-hidden">
      <div className="p-6 md:p-7">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B8FF00]/15 text-[#B8FF00]">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white">
              Portal password
            </h2>
            <p className="mt-0.5 text-[12.5px] font-medium uppercase tracking-[0.12em] text-[#B8FF00]">
              Active
            </p>
          </div>
        </div>

        <p className="text-sm text-white/55 leading-relaxed mb-5">
          You sign in with email + password. The member-number sign-in
          path is retired for your account while a password is set.
        </p>

        {mode === "idle" && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("change")}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.08] transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Change password
            </button>
            <button
              type="button"
              onClick={() => setMode("remove")}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/[0.04] px-4 py-2 text-sm font-semibold text-red-300/90 hover:bg-red-500/[0.08] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove password
            </button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {mode === "change" && (
            <motion.div
              key="changeform"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <PasswordForm
                mode="change"
                memberNumber={memberNumber}
                onCancel={() => setMode("idle")}
              />
            </motion.div>
          )}
          {mode === "remove" && (
            <motion.div
              key="removeform"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: "hidden" }}
            >
              <PasswordForm
                mode="remove"
                memberNumber={memberNumber}
                onCancel={() => setMode("idle")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Sub-form: handles all three flows (set / change / remove). ── */
function PasswordForm({
  mode,
  memberNumber,
  onCancel,
}: {
  mode: "set" | "change" | "remove";
  memberNumber: string;
  onCancel: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsCurrent = mode === "change" || mode === "remove";
  const needsNext = mode === "set" || mode === "change";

  function localStrength(): string | null {
    if (!needsNext) return null;
    if (next.length < 8) return "At least 8 characters.";
    if (/^\d+$/.test(next)) return "Can't be all digits.";
    const normalised = next.replace(/\s+/g, "").toLowerCase();
    const m = memberNumber.toLowerCase();
    if (normalised === m || normalised === m.replace(/^leh/, "")) {
      return "Can't be your member number.";
    }
    if (next !== confirm) return "Passwords don't match.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const localError = localStrength();
    if (localError) {
      setError(localError);
      return;
    }
    setBusy(true);
    try {
      const body: { current?: string; next: string | null } = {
        next: mode === "remove" ? null : next,
      };
      if (needsCurrent) body.current = current;

      const res = await fetch("/api/lehumo/portal/member/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      // Refresh so the server-rendered `hasPassword` prop on the page
      // re-resolves and the card flips to the right state.
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      {needsCurrent && (
        <div>
          <label
            htmlFor="current"
            className="block text-[13px] font-medium text-white/70 mb-1.5"
          >
            Current password
          </label>
          <input
            id="current"
            type="password"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/30 transition-colors"
          />
        </div>
      )}

      {needsNext && (
        <>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="next"
                className="text-[13px] font-medium text-white/70"
              >
                New password
              </label>
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                className="text-[11px] text-white/60 hover:text-white/70 transition-colors inline-flex items-center gap-1"
                aria-label={showNext ? "Hide password" : "Show password"}
              >
                {showNext ? (
                  <>
                    <EyeOff className="h-3 w-3" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Show
                  </>
                )}
              </button>
            </div>
            <input
              id="next"
              type={showNext ? "text" : "password"}
              required
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={8}
              maxLength={200}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/30 transition-colors"
            />
            <p className="mt-1.5 text-[11px] text-white/60 leading-relaxed">
              At least 8 characters. Don&rsquo;t use your member number
              or an all-digits PIN.
            </p>
          </div>
          <div>
            <label
              htmlFor="confirm"
              className="block text-[13px] font-medium text-white/70 mb-1.5"
            >
              Confirm new password
            </label>
            <input
              id="confirm"
              type={showNext ? "text" : "password"}
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/30 transition-colors"
            />
          </div>
        </>
      )}

      {mode === "remove" && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-3.5">
          <p className="text-[12.5px] text-amber-200/85 leading-relaxed flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <span>
              Removing your password switches you back to member-number
              sign-in. Anyone who learns your email could then guess
              your way in via your sequential Leh-number. You can set
              a new password anytime.
            </span>
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.06] px-3.5 py-2.5">
          <p className="text-[12.5px] text-red-300 leading-relaxed">
            {error}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
            mode === "remove"
              ? "bg-red-500/90 text-white hover:bg-red-500"
              : "bg-[#B8FF00] text-[#0B1933] hover:bg-[#a8ef00]"
          }`}
        >
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {mode === "remove" ? "Removing…" : "Saving…"}
            </>
          ) : mode === "remove" ? (
            <>
              <Trash2 className="h-3.5 w-3.5" />
              Remove password
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              {mode === "set" ? "Set password" : "Save new password"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-sm font-medium text-white/55 hover:text-white/85 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
