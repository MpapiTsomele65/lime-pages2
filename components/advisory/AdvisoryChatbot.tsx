"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FLOWS } from "@/lib/advisory-flows";
import type { FlowOption } from "@/lib/advisory-flows";

/* ─── Message type ─── */
interface Message {
  id: number;
  role: "bot" | "user";
  html: string;
}

/* ─── Typing indicator ─── */
function TypingIndicator() {
  return (
    <div className="flex gap-[5px] items-center px-4 py-3 bg-[#E6FAF9] border border-[#E5E7EB] rounded-[18px] rounded-bl-[5px] w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[7px] h-[7px] bg-teal rounded-full animate-bounce"
          style={{ animationDelay: `${i * 180}ms`, animationDuration: "1.3s" }}
        />
      ))}
    </div>
  );
}

/* ─── Main chatbot ─── */
export function AdvisoryChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentOptions, setCurrentOptions] = useState<FlowOption[]>([]);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  /* Navigate to a flow node */
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

  /* Handle user selecting an option */
  const handleOption = useCallback(
    (opt: FlowOption) => {
      idRef.current += 1;
      setMessages((prev) => [
        ...prev,
        { id: idRef.current, role: "user", html: opt.label },
      ]);
      setCurrentOptions([]);
      setTyping(true);

      setTimeout(() => {
        goToNode(opt.next);
      }, 850);
    },
    [goToNode]
  );

  /* Boot the chatbot */
  useEffect(() => {
    if (started) return;
    setStarted(true);
    setTyping(true);
    setTimeout(() => {
      goToNode("start");
    }, 1100);
  }, [started, goToNode]);

  return (
    <div className="w-full max-w-[580px] mx-auto lg:max-w-none">
      <div className="bg-white rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.12),0_0_0_1px_rgba(70,205,207,0.15)] flex flex-col h-[680px] max-h-[80vh] overflow-hidden relative z-[1]">
        {/* Compact header */}
        <div className="bg-gradient-to-r from-[#0B1933] to-[#142744] px-4 py-2.5 flex items-center gap-3 shrink-0 rounded-t-[24px]">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-teal/20 flex items-center justify-center shrink-0">
              <span className="text-teal text-xs font-bold">LP</span>
            </div>
            <span className="text-white text-[13px] font-semibold whitespace-nowrap">
              Lime Advisors
            </span>
            <span className="text-white/40 text-[11px] hidden sm:inline">
              — Know Your Rights
            </span>
          </div>
          <div className="w-2 h-2 bg-teal rounded-full shrink-0 shadow-[0_0_0_3px_rgba(70,205,207,0.25)] animate-pulse" />
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-2 flex flex-col gap-3.5 scroll-smooth [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded-sm">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`max-w-[88%] ${
                  msg.role === "bot" ? "self-start" : "self-end"
                }`}
              >
                <div
                  className={`text-[10px] font-semibold tracking-[0.5px] uppercase mb-1 px-0.5 ${
                    msg.role === "bot"
                      ? "text-[#0a7a7b]"
                      : "text-[#9CA3AF] text-right"
                  }`}
                >
                  {msg.role === "bot" ? "Lime Advisors" : "You"}
                </div>
                <div
                  className={`px-4 py-3 rounded-[18px] text-sm leading-[1.55] ${
                    msg.role === "bot"
                      ? "bg-[#E6FAF9] border border-[#E5E7EB] rounded-bl-[5px] text-[#0B0B0B] advisory-chat-content"
                      : "bg-[#0B1933] text-white rounded-br-[5px]"
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.html }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {typing && (
            <div className="self-start">
              <div className="text-[10px] font-semibold tracking-[0.5px] uppercase mb-1 px-0.5 text-[#0a7a7b]">
                Lime Advisors
              </div>
              <TypingIndicator />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Options area */}
        {currentOptions.length > 0 && (
          <div className="px-4 py-3 border-t border-[#E5E7EB] bg-white shrink-0">
            <div className="text-[10px] font-bold tracking-[0.6px] uppercase text-[#9CA3AF] mb-2">
              Choose an option
            </div>
            <div className="flex flex-wrap gap-[7px]">
              {currentOptions.map((opt) => {
                const isNav =
                  opt.label.includes("Back") ||
                  opt.label.includes("Start over") ||
                  opt.label.includes("menu");
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleOption(opt)}
                    className={`bg-white border-[1.5px] border-teal text-[#0B0B0B] rounded-[22px] px-4 py-2 text-[13px] font-semibold cursor-pointer transition-all duration-150 leading-snug hover:bg-teal hover:border-teal hover:text-[#0B0B0B] hover:-translate-y-px hover:shadow-[0_3px_12px_rgba(70,205,207,0.3)] ${
                      currentOptions.length <= 2 || isNav
                        ? "w-full text-left"
                        : ""
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-[10px] text-[#9CA3AF] text-center px-4 py-2 bg-white border-t border-[#E5E7EB] shrink-0">
          <strong>#ThisIsNotFinancialAdvice</strong> — For educational purposes
          only. Based on the NCA (Act 34 of 2005) &amp; FAIS (Act 37 of 2002).
          Visit{" "}
          <a
            href="https://www.limepages.co.za"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0a7a7b] no-underline"
          >
            limepages.co.za
          </a>{" "}
          for professional advice.
        </div>
      </div>
    </div>
  );
}
