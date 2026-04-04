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
        {/* Header */}
        <div className="bg-[#0B1933] px-5 py-4 flex items-center gap-3.5 shrink-0">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 375 137"
              className="h-7 w-auto shrink-0"
            >
              <g transform="scale(1) translate(1.2, 1.2)">
                <rect y="112" width="354" height="5" fill="#fff" />
                <g
                  transform="matrix(1.61,0,0,1.61,232.7,-21.3)"
                  fill="#46cdcf"
                >
                  <path d="M33.1,25.1c-5.6,5.6-8.7,13-8.7,20.9c0,7.9,3.1,15.3,8.7,20.9c5.6,5.6,13,8.7,20.9,8.7c7.9,0,15.3-3.1,20.9-8.7l0.7-0.7L33.8,24.4L33.1,25.1z M51.7,45.1H35c0.2-4.4,1.9-8.5,4.9-11.8L51.7,45.1z M51.5,47.1L39.8,58.8c-2.9-3.2-4.6-7.3-4.8-11.6H51.5z M53.3,48.1V65c-4.3-0.1-8.6-1.7-12.1-4.8L53.3,48.1z M55.3,48.8l11.3,11.3c-3.2,2.9-7.2,4.6-11.3,4.9V48.8z M38.5,31.9c-3.6,3.9-5.5,8.9-5.5,14.2c0,5.6,2.2,10.9,6.1,14.8C43.2,65,48.5,67,53.9,67c0.1,0,0.2,0,0.3,0c0,0,0.1,0,0.1,0c0.1,0,0.1,0,0.2,0c4.9-0.1,9.7-2,13.6-5.5l4.7,4.7C67.6,71,61,73.6,54,73.6c-7.4,0-14.3-2.9-19.5-8.1S26.4,53.4,26.4,46c0-7,2.6-13.7,7.4-18.8L38.5,31.9z" />
                </g>
                <g
                  transform="matrix(2.37,0,0,2.37,-4.7,28.6)"
                  fill="#fff"
                >
                  <path d="M4.3262 17.9102 l4.5996 0 l0 2.0898 l-6.9336 0 l0 -13.926 l2.334 0 l0 11.836 z M11.4062625 20 l0 -13.926 l2.334 0 l0 13.926 l-2.334 0 z M33.086421875 20 l-2.3145 0 l-0.91797 -10.996 l-3.9941 10.996 l-1.4648 0 l-3.9746 -10.977 l-0.92773 10.977 l-2.3242 0 l1.1133 -13.926 l3.252 0 l3.584 9.8438 l3.6133 -9.8438 l3.252 0 z M44.287084375 8.154 l-5.4102 0 l0 3.8574 l4.7852 0 l0 2.0605 l-4.7852 0 l0 3.8379 l5.4102 0 l0 2.0898 l-7.7734 0 l0 -13.926 l7.7734 0 l0 2.0801 z" />
                </g>
                <g
                  transform="matrix(2.31,0,0,2.31,102.7,29.4)"
                  fill="#fff"
                >
                  <path d="M11.3154328125 6.074 c2.6172 0 4.2871 1.9629 4.2871 4.3848 c0 2.4609 -1.6699 4.3457 -4.2871 4.3457 l-3.2031 0 l0 5.1953 l-2.334 0 l0 -13.926 l5.5371 0 z M10.9443328125 12.8125 c1.5625 0 2.3828 -0.95703 2.3828 -2.3828 c0 -1.377 -0.82031 -2.3828 -2.3828 -2.3828 l-2.832 0 l0 4.7656 l2.832 0 z M26.09784375 20 l-1.1035 -3.0957 l-6.084 0 l-1.0938 3.0957 l-2.4121 0 l5.127 -13.926 l2.8418 0 l5.127 13.926 l-2.4023 0 z M19.62304375 14.9023 l4.668 0 l-2.334 -6.582 z M35.4990390625 20.18555 c-3.9453 0 -6.9336 -2.7051 -6.9336 -7.1191 c0 -4.4434 3.0273 -7.1875 7.0313 -7.1875 c2.6172 0 4.8242 1.1523 6.0352 3.2617 l-2.0605 1.1035 c-0.82031 -1.5527 -2.2852 -2.2852 -3.9746 -2.2852 c-2.6465 0 -4.6777 1.8066 -4.6777 5.0586 c0 3.1836 1.9531 5.0977 4.7656 5.0977 c2.1289 0 3.8965 -1.1426 4.248 -3.5352 l-4.248 0 l0 -1.9238 l6.4844 0 l0 7.3438 l-1.8652 0 l0 -2.2656 c-0.91797 1.543 -2.5391 2.4512 -4.8047 2.4512 z M51.873021875 8.154 l-5.4102 0 l0 3.8574 l4.7852 0 l0 2.0605 l-4.7852 0 l0 3.8379 l5.4102 0 l0 2.0898 l-7.7734 0 l0 -13.926 l7.7734 0 l0 2.0801 z M58.1200734375 20.18555 c-2.9492 0 -5.1563 -1.4063 -5.6055 -3.8672 l2.4023 -0.55664 c0.25391 1.6016 1.5723 2.4805 3.291 2.4805 c1.3574 0 2.5879 -0.57617 2.5684 -2.041 c-0.019531 -1.5234 -1.709 -1.9629 -3.5352 -2.4805 c-2.1094 -0.61523 -4.2773 -1.3184 -4.2773 -3.877 c0 -2.5977 2.1289 -3.9648 4.7754 -3.9648 c2.4414 0 4.7559 1.0254 5.293 3.5254 l-2.2559 0.56641 c-0.3125 -1.4844 -1.4648 -2.1387 -2.9199 -2.1387 c-1.2988 0 -2.5293 0.55664 -2.5293 1.9727 c0 1.2891 1.4746 1.6895 3.1641 2.1582 c2.1777 0.60547 4.6973 1.3477 4.6973 4.1406 c0 2.8809 -2.4121 4.082 -5.0684 4.082 z" />
                </g>
              </g>
            </svg>
            <div className="w-px h-7 bg-white/20" />
            <span className="text-white/60 text-xs font-medium tracking-wide whitespace-nowrap">
              Lime Advisors
            </span>
          </div>
          <div className="w-2 h-2 bg-teal rounded-full shrink-0 shadow-[0_0_0_3px_rgba(70,205,207,0.25)] animate-pulse" />
        </div>

        {/* Intro banner */}
        <div className="bg-gradient-to-br from-teal to-[#2ec4c6] px-5 py-3.5 flex items-center gap-3 shrink-0">
          <span className="text-[22px]">&#9878;&#65039;</span>
          <div className="text-[#0B1933] text-[13px] font-semibold leading-snug">
            Know Your Rights — Building Wealth Together
            <br />
            <span className="font-normal opacity-75">
              Free consumer rights guidance powered by Lime Pages
            </span>
          </div>
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
