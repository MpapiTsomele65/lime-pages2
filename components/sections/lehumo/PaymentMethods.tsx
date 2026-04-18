"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Lock } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

/* ── Inline SVG logos for card networks ── */

function VisaLogo() {
  return (
    <svg viewBox="0 0 780 500" className="h-6 w-auto" aria-label="Visa">
      <path
        d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8h-53.4zm246.8-191.2c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.5-90.2 64.5-.3 28.1 26.5 43.7 46.8 53.1 20.8 9.6 27.8 15.7 27.7 24.3-.1 13.1-16.6 19.1-32 19.1-21.4 0-32.7-3-50.3-10.2l-6.9-3.1-7.5 43.8c12.5 5.5 35.6 10.2 59.6 10.5 56.1 0 92.5-26.2 92.9-66.8.2-22.3-14-39.2-44.8-53.2-18.6-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.5 40 7.5l4.8 2.3 7.2-42.4zm137.3-4.6h-41.3c-12.8 0-22.4 3.5-28 16.2l-79.4 179.4h56.1l11.2-29.2h68.5l6.5 29.2h49.5l-43.1-195.6zm-65.9 126.2c4.4-11.3 21.4-54.7 21.4-54.7-.3.5 4.4-11.4 7.1-18.7l3.6 16.9 12.4 56.5h-44.5zM327.1 152.9L280.5 279l-5-24.2c-8.7-27.8-35.7-57.9-65.9-73l47.8 170.7h56.5l84.1-199.6h-56.5l-14.4-.1z"
        fill="#1A1F71"
      />
      <path
        d="M209.6 152.9h-86l-.7 4c67 16.2 111.4 55.3 129.7 102.3l-18.7-89.6c-3.2-12.3-12.8-16.2-24.3-16.7z"
        fill="#F9A533"
      />
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 780 500" className="h-6 w-auto" aria-label="Mastercard">
      <circle cx="312" cy="250" r="150" fill="#EB001B" />
      <circle cx="468" cy="250" r="150" fill="#F79E1B" />
      <path
        d="M390 120.6c-35.3 27.8-57.9 71-57.9 119.4s22.6 91.6 57.9 119.4c35.3-27.8 57.9-71 57.9-119.4s-22.6-91.6-57.9-119.4z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function AmexLogo() {
  return (
    <div className="h-6 px-1.5 rounded bg-[#006FCF] flex items-center justify-center">
      <span className="text-[9px] font-extrabold text-white tracking-wide">
        AMEX
      </span>
    </div>
  );
}

function ApplePayLogo() {
  return (
    <div className="h-6 px-2 rounded bg-black flex items-center justify-center gap-0.5">
      <svg viewBox="0 0 17 20" className="h-3 w-auto" fill="white">
        <path d="M13.312 10.445c-.024-2.467 2.012-3.651 2.103-3.707-1.146-1.675-2.929-1.905-3.565-1.931-1.518-.153-2.961.894-3.731.894-.77 0-1.962-.871-3.224-.848-1.659.024-3.189.965-4.043 2.452C-.857 10.04.443 14.162 2.088 16.568c.822 1.177 1.801 2.501 3.088 2.453 1.239-.049 1.708-.802 3.206-.802 1.498 0 1.919.802 3.228.777 1.335-.024 2.179-1.201 2.998-2.382.945-1.366 1.334-2.688 1.358-2.758-.03-.013-2.604-1-2.654-3.411zM10.868 3.21c.684-.829 1.145-1.98 1.019-3.128-0.985.04-2.181.656-2.889 1.484-.634.734-1.19 1.906-1.041 3.031 1.1.085 2.223-.558 2.911-1.387z" />
      </svg>
      <span className="text-[9px] font-semibold text-white">Pay</span>
    </div>
  );
}

/* ── Payment method groups ── */
const cardMethods = [
  { name: "Visa", Component: VisaLogo },
  { name: "Mastercard", Component: MastercardLogo },
  { name: "Amex", Component: AmexLogo },
  { name: "Apple Pay", Component: ApplePayLogo },
];

const altPayments = [
  { name: "Ozow", logo: "/images/logos/ozow.png" },
  { name: "SnapScan", logo: "/images/logos/snapscan.svg" },
  { name: "Scan to Pay", logo: "/images/logos/scan-to-pay.svg" },
];

const banks = [
  { name: "FNB", logo: "/images/logos/fnb.svg" },
  { name: "Standard Bank", logo: "/images/logos/standard-bank.svg" },
  { name: "Absa", logo: "/images/logos/absa.png" },
  { name: "Nedbank", logo: "/images/logos/nedbank.png" },
  { name: "Capitec", logo: "/images/logos/capitec.png" },
];

export function PaymentMethods() {
  return (
    <motion.div
      {...fadeUp}
      className="bg-white/[0.03] border border-white/[0.08] rounded-[20px] px-7 py-7 mb-14 max-w-[800px] mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <span className="text-[10px] font-bold uppercase tracking-[1.4px] text-white/35 block mb-1.5">
          Accepted Payment Methods
        </span>
        <p className="text-xs text-white/45">
          Pay your way — all payments processed securely via Paystack
        </p>
      </div>

      {/* Card Networks */}
      <div className="mb-5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/25 block mb-3">
          Card Payments
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {cardMethods.map((m) => (
            <div
              key={m.name}
              className="h-10 px-3 rounded-xl bg-white flex items-center justify-center shadow-sm"
            >
              <m.Component />
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Payments */}
      <div className="mb-5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/25 block mb-3">
          Instant Payments
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {altPayments.map((m) => (
            <div
              key={m.name}
              className="h-10 px-4 rounded-xl bg-white flex items-center justify-center shadow-sm"
            >
              <Image
                src={m.logo}
                alt={m.name}
                width={80}
                height={24}
                className="h-5 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* EFT / Bank Transfers */}
      <div className="mb-6">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/25 block mb-3">
          EFT / Bank Transfer
        </span>
        <div className="flex flex-wrap items-center gap-3">
          {banks.map((b) => (
            <div
              key={b.name}
              className="h-10 px-3 rounded-xl bg-white flex items-center justify-center shadow-sm"
            >
              <Image
                src={b.logo}
                alt={b.name}
                width={80}
                height={24}
                className="h-5 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Secured by Paystack */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/[0.06]">
        <Lock size={12} className="text-white" />
        <span className="text-[11px] text-white font-medium">
          Secured by
        </span>
        <Image
          src="/images/logos/paystack.svg"
          alt="Paystack"
          width={80}
          height={20}
          className="h-4 w-auto object-contain"
        />
      </div>
    </motion.div>
  );
}
