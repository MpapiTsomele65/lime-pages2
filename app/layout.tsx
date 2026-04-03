import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Lime Pages — Building Wealth Together",
  description:
    "Advisory & Fintech solutions to fuel Africa's entrepreneurial revolution. Equipping entrepreneurs and young professionals with tools to build thriving businesses and generational wealth.",
  keywords: [
    "Lime Pages",
    "financial advisory",
    "South Africa",
    "SMME",
    "fintech",
    "Lehumo",
    "collective investment",
    "generational wealth",
  ],
  openGraph: {
    title: "Lime Pages — Building Wealth Together",
    description:
      "Advisory & Fintech solutions to fuel Africa's entrepreneurial revolution.",
    type: "website",
    locale: "en_ZA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} antialiased`}>
      <body className="min-h-screen flex flex-col font-sans bg-white text-ink">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
