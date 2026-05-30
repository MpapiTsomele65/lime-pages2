"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, Lock } from "lucide-react";

/**
 * "Forgot password" entry point for the optional password layer.
 *
 * Collects email + member number — per the user-chosen reset flow
 * ("Email magic link + must re-enter member number"). On submit, the
 * API returns the same `success: true` regardless of whether the pair
 * matched, so this page can't be used to enumerate which emails are
 * members or which members have a password set. We always show the
 * same "check your email" confirmation.
 *
 * Distinct from `/lehumo/portal/forgot` (which recovers the member
 * number itself for members who haven't opted in to a password).
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lehumo/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          memberNumber: memberNumber.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
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
          <Link
            href="/lehumo/portal/login"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/55 hover:text-white/85 transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>

          {!sent ? (
            <>
              <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#46CDCF]/15 text-[#46CDCF]">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Reset your password
                  </h1>
                  <p className="mt-1 text-sm text-white/55 leading-relaxed">
                    Enter the email and member number on file. We&rsquo;ll
                    send a 15-minute reset link to your inbox.
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
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/30 transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="memberNumber"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Member ID
                  </label>
                  <input
                    id="memberNumber"
                    type="text"
                    required
                    autoComplete="off"
                    autoCapitalize="characters"
                    value={memberNumber}
                    onChange={(e) => setMemberNumber(e.target.value)}
                    placeholder="e.g. Leh01"
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-[#B8FF00]/50 focus:ring-1 focus:ring-[#B8FF00]/30 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#B8FF00] py-3 px-6 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors disabled:opacity-50"
                >
                  {loading ? "Sending link…" : "Email me a reset link"}
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
              <h2 className="text-xl font-bold text-white">Check your email</h2>
              <p className="mt-2 text-sm text-white/55 leading-relaxed">
                If we found a Lehumo account matching that email and
                member number, a reset link is on its way. The link
                expires in 15 minutes.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-2 text-[12.5px] text-white/55">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
