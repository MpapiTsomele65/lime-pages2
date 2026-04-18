"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Script from "next/script";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: Record<string, unknown>) => void;
        signIn: () => Promise<{ authorization: { id_token: string } }>;
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState("");
  const googleBtnRef = useRef<HTMLDivElement>(null);

  /* ── Standard login ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/lehumo/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          memberNumber: memberNumber.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/lehumo/portal");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  /* ── Google Sign-In callback ── */
  const handleGoogleCallback = useCallback(
    async (response: { credential: string }) => {
      setError("");
      setOauthLoading("google");

      try {
        const res = await fetch("/api/lehumo/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Google sign-in failed.");
          setOauthLoading("");
          return;
        }

        if (data.action === "login") {
          router.push("/lehumo/portal");
        } else if (data.action === "onboard") {
          // No account found — redirect to onboarding with pre-filled email
          router.push(
            `/lehumo/onboard?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}`,
          );
        }
      } catch {
        setError("Something went wrong with Google sign-in.");
        setOauthLoading("");
      }
    },
    [router],
  );

  /* ── Initialize Google Sign-In when script loads ── */
  const initGoogle = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
      auto_select: false,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      width: "100%",
      text: "continue_with",
      shape: "pill",
    });
  }, [handleGoogleCallback]);

  useEffect(() => {
    if (window.google) initGoogle();
  }, [initGoogle]);

  /* ── Apple Sign-In ── */
  async function handleAppleSignIn() {
    setError("");
    setOauthLoading("apple");

    try {
      if (!window.AppleID) {
        setError("Apple Sign-In is not available.");
        setOauthLoading("");
        return;
      }

      window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "",
        scope: "name email",
        redirectURI: `${window.location.origin}/api/lehumo/auth/apple`,
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization.id_token;

      // Decode email from Apple's JWT (client-side only for display)
      const payload = JSON.parse(atob(idToken.split(".")[1]));
      const appleEmail = payload.email;

      // Use same Google endpoint pattern — verify & lookup
      const res = await fetch("/api/lehumo/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: idToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If Google verification fails, try Apple-specific lookup
        if (appleEmail) {
          const loginRes = await fetch("/api/lehumo/auth/forgot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: appleEmail }),
          });

          if (loginRes.ok) {
            setError(
              "We found your account. Check your email for your member number to sign in.",
            );
            setOauthLoading("");
            return;
          }
        }
        setError(data.error || "Apple sign-in failed.");
        setOauthLoading("");
        return;
      }

      if (data.action === "login") {
        router.push("/lehumo/portal");
      } else if (data.action === "onboard") {
        router.push(
          `/lehumo/onboard?email=${encodeURIComponent(data.email)}&name=${encodeURIComponent(data.name)}`,
        );
      }
    } catch {
      setError("Apple sign-in was cancelled or failed.");
      setOauthLoading("");
    }
  }

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
  const hasOAuth = googleClientId || appleClientId;

  return (
    <>
      {/* Google Identity Services script */}
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={initGoogle}
        />
      )}

      {/* Apple Sign-In script */}
      {appleClientId && (
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
          strategy="afterInteractive"
        />
      )}

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
            {/* Branding */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Lehumo
              </h1>
              <p className="text-white/50 text-sm mt-1">
                Collective Investment Trust
              </p>
            </div>

            {/* ── OAuth buttons ── */}
            {hasOAuth && (
              <>
                <div className="space-y-3 mb-6">
                  {/* Google button */}
                  {googleClientId && (
                    <div className="relative">
                      <div
                        ref={googleBtnRef}
                        className={`w-full [&>div]:!w-full [&_iframe]:!w-full ${oauthLoading === "google" ? "opacity-50 pointer-events-none" : ""}`}
                      />
                      {/* Fallback button if GIS hasn't loaded */}
                      {!googleBtnRef.current?.children.length && (
                        <button
                          type="button"
                          disabled={!!oauthLoading}
                          className="w-full flex items-center justify-center gap-3 bg-white rounded-full py-3 px-6 text-sm font-semibold text-[#1f1f1f] hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          Continue with Google
                        </button>
                      )}
                    </div>
                  )}

                  {/* Apple button */}
                  {appleClientId && (
                    <button
                      type="button"
                      onClick={handleAppleSignIn}
                      disabled={!!oauthLoading}
                      className="w-full flex items-center justify-center gap-3 bg-white rounded-full py-3 px-6 text-sm font-semibold text-[#1f1f1f] hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      {oauthLoading === "apple" ? (
                        <svg
                          className="h-4 w-4 animate-spin text-gray-500"
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
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                      )}
                      Continue with Apple
                    </button>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span className="text-xs text-white/25 font-medium">
                    or sign in with Member ID
                  </span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            {/* ── Email + Member # form ── */}
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
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="memberNumber"
                    className="text-sm font-medium text-white/70"
                  >
                    Member ID
                  </label>
                  <Link
                    href="/lehumo/portal/forgot"
                    className="text-xs text-teal/70 hover:text-teal transition-colors"
                  >
                    Forgot your ID?
                  </Link>
                </div>
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
                disabled={loading || !!oauthLoading}
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-xs text-white/30">
                Not a member yet?{" "}
                <Link
                  href="/lehumo/onboard"
                  className="text-[#46CDCF] hover:text-[#46CDCF]/80 transition-colors font-medium"
                >
                  Create an account
                </Link>
              </p>
              <p className="text-xs text-white/20">
                <Link
                  href="/lehumo"
                  className="hover:text-white/40 transition-colors"
                >
                  Learn about Lehumo
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
