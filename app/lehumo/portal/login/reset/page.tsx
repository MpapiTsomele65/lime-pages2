"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Loader2,
} from "lucide-react";

/**
 * Password-reset landing page. Lands here from the magic-link email
 * with the reset token in `?token=`. Collects + confirms the new
 * password and POSTs both to `/api/lehumo/auth/password/reset`. On
 * success → success screen → "Sign in" button back to /login.
 *
 * The page itself is a Client Component because it reads
 * `useSearchParams` and runs the form. Wrapped in Suspense to satisfy
 * Next.js 16's build-time requirement (same pattern as /login).
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0B1933]" />}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}

function ResetPasswordPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function localStrength(): string | null {
    if (next.length < 8) return "Password must be at least 8 characters.";
    if (/^\d+$/.test(next)) return "Password can't be all digits.";
    if (next !== confirm) return "Passwords don't match.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const localError = localStrength();
    if (localError) {
      setError(localError);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/lehumo/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // No token in URL — bail out with a helpful "request a new one" message
  // rather than rendering a broken form.
  if (!token) {
    return (
      <div className="relative min-h-screen bg-[#0B1933] flex items-center justify-center px-4">
        <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-8 md:p-10 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-white">
            Reset link is missing
          </h1>
          <p className="mt-2 text-sm text-white/55 leading-relaxed">
            Open the link from the email we sent. If the link is older
            than 15 minutes, request a new one.
          </p>
          <Link
            href="/lehumo/portal/login/forgot-password"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#B8FF00] px-5 py-2.5 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#0B1933] flex items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#B8FF00]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[380px] w-[380px] rounded-full bg-[#46CDCF]/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#0F2040] rounded-[20px] border border-white/[0.06] p-8 md:p-10 shadow-2xl">
          {!success ? (
            <>
              <Link
                href="/lehumo/portal/login"
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/55 hover:text-white/85 transition-colors mb-6"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>

              <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Pick a new password
                  </h1>
                  <p className="mt-1 text-sm text-white/55 leading-relaxed">
                    Once you submit, you&rsquo;ll sign in with email + this
                    new password from now on.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="next"
                      className="text-sm font-medium text-white/70"
                    >
                      New password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNext((v) => !v)}
                      className="text-[11px] text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1"
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
                    minLength={8}
                    maxLength={200}
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/30 transition-colors"
                  />
                  <p className="mt-1.5 text-[11px] text-white/40">
                    At least 8 characters. Avoid all-digits PINs and your
                    member number.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-sm font-medium text-white/70 mb-2"
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
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/30 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#B8FF00] py-3 px-6 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Set new password"
                  )}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#B8FF00]/15 text-[#B8FF00] mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Password updated
              </h2>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">
                Sign in with your email and new password.
              </p>
              <button
                type="button"
                onClick={() => router.push("/lehumo/portal/login")}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#B8FF00] px-5 py-2.5 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors"
              >
                Sign in
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
