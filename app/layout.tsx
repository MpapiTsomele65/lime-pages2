import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/animations/PageTransition";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lime-pages.vercel.app"),
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
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Lime Pages — Building Wealth Together",
    description:
      "Advisory & Fintech solutions to fuel Africa's entrepreneurial revolution.",
    siteName: "Lime Pages",
    url: "https://lime-pages.vercel.app",
    type: "website",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lime Pages — Building Wealth Together",
    description:
      "Advisory & Fintech solutions to fuel Africa's entrepreneurial revolution.",
  },
  other: {
    "instagram:site": "@limepages",
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
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
