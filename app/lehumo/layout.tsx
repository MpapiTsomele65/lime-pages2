import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lehumo — Collective Investment Trust | Lime Pages",
  description:
    "Join 30 Founding Members building an Investment Trust to create Generational Wealth. R1,000/month. 5-Year Lock-in. R2 Million target.",
};

export default function LehumoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="dark-theme">{children}</div>;
}
