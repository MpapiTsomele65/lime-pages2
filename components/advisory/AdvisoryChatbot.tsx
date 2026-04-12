"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowUp } from "lucide-react";
import { FLOWS } from "@/lib/advisory-flows";
import type { FlowOption } from "@/lib/advisory-flows";

/* ─── Keyword → node routing ─── */
const KEYWORD_ROUTES: { keywords: string[]; node: string; label: string }[] = [
  { keywords: ["credit", "loan", "debt", "nca", "borrow", "store account", "home loan", "blacklist", "credit card"], node: "nca_main", label: "Credit, Loans & Debt" },
  { keywords: ["collector", "harass", "phone call", "threatening"], node: "nca_harassment", label: "Debt Collector Harassment" },
  { keywords: ["debt review", "debt counsell", "over-indebted", "overindebted", "can't pay", "cant pay"], node: "nca_overindebted", label: "Debt Review" },
  { keywords: ["credit record", "credit report", "credit score", "credit bureau", "transunion", "experian"], node: "nca_credit_record", label: "Credit Record" },
  { keywords: ["reckless", "couldn't afford", "affordability"], node: "nca_reckless", label: "Reckless Lending" },
  { keywords: ["interest", "overcharg", "fee", "service fee", "initiation fee"], node: "nca_overcharged", label: "Overcharged on Credit" },
  { keywords: ["fais", "financial advi", "broker", "adviser", "advisor"], node: "fais_main", label: "Financial Advice & FAIS" },
  { keywords: ["insurance", "claim reject", "claim denied", "policy"], node: "fais_insurance", label: "Insurance Claims" },
  { keywords: ["invest", "etf", "unit trust", "share", "stock", "portfolio"], node: "invest_main", label: "Investing" },
  { keywords: ["tfsa", "tax free", "tax-free", "retirement annuity"], node: "invest_tfsa_vs_ra", label: "TFSA vs Retirement Annuity" },
  { keywords: ["scam", "pyramid", "ponzi", "guaranteed return", "too good"], node: "invest_scams", label: "Investment Scams" },
  { keywords: ["two-pot", "two pot", "twopot", "savings pot", "retirement component"], node: "two_pot_explainer", label: "Two-Pot System" },
  { keywords: ["pension", "provident", "retirement", "resign"], node: "pension_main", label: "Pension & Retirement" },
  { keywords: ["consumer", "defective", "broken", "return", "refund", "cpa", "warranty"], node: "cpa_main", label: "Consumer Rights" },
  { keywords: ["contract", "cancel", "cooling off", "fixed term"], node: "cpa_contracts", label: "Contracts & Cancellation" },
  { keywords: ["mislead", "false advert", "bait", "marketing"], node: "cpa_misleading", label: "Misleading Marketing" },
  { keywords: ["budget", "cash flow", "50/30/20", "spending"], node: "cfp_cashflow", label: "Budgeting" },
  { keywords: ["estate", "will", "wills", "inheritance", "executor"], node: "cfp_estate", label: "Estate Planning & Wills" },
  { keywords: ["tax", "sars", "capital gain"], node: "cfp_tax", label: "Tax Planning" },
  { keywords: ["fund", "grant", "sefa", "nef", "nyda", "smme", "startup", "business loan"], node: "smme_main", label: "Business Funding" },
  { keywords: ["esd", "supplier", "enterprise develop", "b-bbee"], node: "smme_esd", label: "ESD & Corporate Funding" },
  { keywords: ["cfp", "financial plan"], node: "cfp_main", label: "Financial Planning" },
  { keywords: ["warren", "ingram"], node: "ingram_main", label: "Warren Ingram's Wisdom" },
];

function matchQuery(query: string): { node: string; label: string } | null {
  const q = query.toLowerCase();
  let bestMatch: { node: string; label: string; score: number } | null = null;
  for (const route of KEYWORD_ROUTES) {
    let score = 0;
    for (const kw of route.keywords) {
      if (q.includes(kw)) score += kw.length;
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { node: route.node, label: route.label, score };
    }
  }
  return bestMatch ? { node: bestMatch.node, label: bestMatch.label } : null;
}

/* ─── Types ─── */
interface Message {
  id: number;
  role: "bot" | "user";
  html: string;
}

/* ─── Bot avatar ─── */
function BotAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-teal/15 flex items-center justify-center shrink-0 mt-0.5">
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-teal" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1M5.6 5.6l.7.7m12.1-.7-.7.7M5.6 18.4l.7-.7m12.1.7-.7-.7" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    </div>
  );
}

/* ─── Typing indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <BotAvatar />
      <div className="flex gap-1 items-center px-4 py-3 bg-[#F4F4F5] rounded-2xl rounded-tl-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[6px] h-[6px] bg-[#A1A1AA] rounded-full animate-bounce"
            style={{ animationDelay: `${i * 200}ms`, animationDuration: "1.4s" }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main chatbot ─── */
export function AdvisoryChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentOptions, setCurrentOptions] = useState<FlowOption[]>([]);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [freeText, setFreeText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  const goToNode = useCallback((key: string) => {
    const node = FLOWS[key];
    if (!node) return;
    idRef.current += 1;
    setMessages((prev) => [
      ...prev,
      { id: idRef.current, role: "bot", html: node.message },
    ]);
    setCurrentOptions(node.options || []);
    setTyping(false);
  }, []);

  const handleOption = useCallback(
    (opt: FlowOption) => {
      idRef.current += 1;
      setMessages((prev) => [
        ...prev,
        { id: idRef.current, role: "user", html: opt.label },
      ]);
      setCurrentOptions([]);
      setTyping(true);
      setTimeout(() => goToNode(opt.next), 850);
    },
    [goToNode]
  );

  const handleFreeTextSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const query = freeText.trim();
      if (!query) return;

      idRef.current += 1;
      setMessages((prev) => [
        ...prev,
        { id: idRef.current, role: "user", html: query },
      ]);
      setFreeText("");
      setCurrentOptions([]);
      setTyping(true);

      setTimeout(() => {
        const match = matchQuery(query);
        if (match) {
          goToNode(match.node);
        } else {
          idRef.current += 1;
          setMessages((prev) => [
            ...prev,
            {
              id: idRef.current,
              role: "bot",
              html: `I couldn\u2019t find an exact match for that \u2014 let me help you narrow it down.`,
            },
          ]);
          setCurrentOptions([
            { label: "Know Your Rights", next: "start_rights" },
            { label: "Investing & Planning", next: "start_wealth" },
            { label: "Pension & Two-Pot", next: "pension_main" },
            { label: "Business Funding", next: "smme_main" },
          ]);
          setTyping(false);
        }
      }, 850);
    },
    [freeText, goToNode]
  );

  useEffect(() => {
    if (started) return;
    setStarted(true);
    setTyping(true);
    setTimeout(() => goToNode("start"), 1100);
  }, [started, goToNode]);

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <div className="bg-white rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] flex flex-col h-[700px] max-h-[82vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-[#F4F4F5] shrink-0">
          <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-teal" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v1m0 16v1m-8-9H3m18 0h-1M5.6 5.6l.7.7m12.1-.7-.7.7M5.6 18.4l.7-.7m12.1.7-.7-.7" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-[#0B0B0B] leading-tight">
              Lime Advisors
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-[#71717A] font-medium">
                Always available
              </span>
            </div>
          </div>
          <div className="text-[10px] text-[#A1A1AA] font-semibold tracking-wide uppercase bg-[#F4F4F5] rounded-full px-3 py-1">
            Free
          </div>
        </div>

        {/* ── Messages ── */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-5 pt-5 pb-3 flex flex-col gap-4 scroll-smooth [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-[#E4E4E7] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "items-start gap-2.5"
                }`}
              >
                {msg.role === "bot" && <BotAvatar />}
                <div
                  className={`max-w-[85%] px-4 py-3 text-[13.5px] leading-[1.6] ${
                    msg.role === "bot"
                      ? "bg-[#F4F4F5] text-[#18181B] rounded-2xl rounded-tl-sm advisory-chat-content"
                      : "bg-[#0B1933] text-white rounded-2xl rounded-br-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.html }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {typing && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Options chips ── */}
        <AnimatePresence>
          {currentOptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="px-5 pt-2 pb-3 border-t border-[#F4F4F5] shrink-0"
            >
              <div className="flex flex-wrap gap-2">
                {currentOptions.map((opt, i) => {
                  const isNav =
                    opt.label.includes("Back") ||
                    opt.label.includes("Start over") ||
                    opt.label.includes("menu");
                  return (
                    <motion.button
                      key={opt.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.15, delay: 0.03 * i }}
                      onClick={() => handleOption(opt)}
                      className={`text-[12.5px] font-medium leading-snug cursor-pointer transition-all duration-150 ${
                        isNav
                          ? "text-[#71717A] bg-transparent border border-[#E4E4E7] rounded-full px-3.5 py-[7px] hover:bg-[#F4F4F5] hover:border-[#D4D4D8]"
                          : "text-[#18181B] bg-white border border-[#E4E4E7] rounded-xl px-3.5 py-[9px] hover:border-teal hover:bg-teal/[0.04] hover:shadow-[0_1px_4px_rgba(70,205,207,0.15)] active:scale-[0.98]"
                      } ${
                        currentOptions.length <= 2 || isNav
                          ? "w-full text-left"
                          : ""
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input bar ── */}
        <div className="px-4 pb-4 pt-2 shrink-0">
          <form
            onSubmit={handleFreeTextSubmit}
            className="flex items-center gap-2 bg-[#F4F4F5] rounded-2xl px-4 py-1 focus-within:ring-2 focus-within:ring-teal/25 focus-within:bg-white focus-within:shadow-[0_0_0_1px_rgba(70,205,207,0.3)] transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent py-2.5 text-[13.5px] text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none"
              disabled={typing}
            />
            <button
              type="submit"
              disabled={!freeText.trim() || typing}
              className="w-8 h-8 rounded-xl bg-[#0B1933] flex items-center justify-center shrink-0 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-[#162a4d] active:scale-95 transition-all"
            >
              <ArrowUp className="w-4 h-4 text-white" strokeWidth={2.5} />
            </button>
          </form>
          <p className="text-[10px] text-[#A1A1AA] text-center mt-2.5 leading-snug">
            #ThisIsNotFinancialAdvice &middot; Based on NCA, FAIS &amp; CPA
            &middot;{" "}
            <a href="https://www.limepages.co.za" target="_blank" rel="noopener noreferrer" className="text-teal hover:underline">
              limepages.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
