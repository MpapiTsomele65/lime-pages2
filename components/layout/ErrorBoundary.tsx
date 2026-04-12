"use client";

import React from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="py-16 bg-snow">
          <Container>
            <div className="max-w-[440px] mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-[#3F3F46] leading-relaxed mb-6">
                This section couldn&apos;t load properly. Try refreshing the
                page or come back later.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="inline-flex items-center gap-2 bg-navy text-white px-6 py-2.5 rounded-full text-sm font-bold hover:-translate-y-0.5 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-navy px-6 py-2.5 rounded-full text-sm font-semibold border border-border hover:bg-snow transition-all"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </Container>
        </div>
      );
    }

    return this.props.children;
  }
}
