"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotMemberNumberPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lehumo/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0B1933] flex items-center justify-center px-4 overflow-hidden">
      {/* Glow orbs */}
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
          {/* Back link */}
          <Link
            href="/lehumo/portal/login"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-teal transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>

          {sent ? (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-lime/10 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-lime" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Check your email
              </h1>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                If an account exists for <strong className="text-white">{email}</strong>,
                we&apos;ve sent your Member ID and login details. Check your inbox
                (and spam folder).
              </p>
              <Link
                href="/lehumo/portal/login"
                className="inline-flex items-center gap-2 bg-lime text-navy px-7 py-3 rounded-full font-bold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(184,255,0,0.3)] transition-all"
              >
                Sign In Now
              </Link>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-5">
                  <Mail className="w-7 h-7 text-teal" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Forgot your Member ID?
                </h1>
                <p className="text-white/50 text-sm leading-relaxed">
                  Enter the email you signed up with and we&apos;ll send your
                  Member ID (e.g. Leh01) straight to your inbox.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-white/70 mb-2"
                  >
                    Email address
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#B8FF00] py-3 px-6 text-sm font-semibold text-[#0B1933] hover:bg-[#a8ef00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send My Member ID"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
