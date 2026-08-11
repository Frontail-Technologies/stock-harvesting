"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Reveal } from "./Reveal";

const FAQ_ITEMS = [
  {
    question: "Is Stock Harvesting a trading platform?",
    answer:
      "No. Stock Harvesting is a stock scanning and chart-review workspace. It helps you surface and inspect market behaviour, but it does not place trades on your behalf.",
  },
  {
    question: "How does the scanner decide what to surface?",
    answer:
      "Stock Harvesting uses a proprietary analysis methodology to identify relevant market behaviour and display the result directly in chart context.",
  },
  {
    question: "Can I review different historical ranges?",
    answer:
      "Yes. The scanner includes historical range controls so you can review the same stock across different periods without leaving the workspace.",
  },
  {
    question: "Which markets does Stock Harvesting support?",
    answer:
      "Stock Harvesting is being built across NSE, BSE and US market coverage, with broader worldwide exchange support expanding over time.",
  },
  {
    question: "Can I use Stock Harvesting on smaller screens?",
    answer:
      "The workspace is designed to remain usable across screen sizes, with controls adapting to available space.",
  },
  {
    question: "Does Stock Harvesting guarantee profitable trades?",
    answer:
      "No. Stock Harvesting is a research and chart-review tool. Scanner results and historical context should be used as part of your own analysis and do not guarantee future market performance.",
  },
];

function FaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="landing-faq-item">
      <button
        type="button"
        className="landing-faq-trigger"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="landing-faq-question">{question}</span>
        <span className="landing-faq-icon">
          {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="landing-faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <p className="landing-faq-answer-inner">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="landing-section relative overflow-hidden border-t border-white/8"
      aria-labelledby="faq-heading"
    >
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative landing-faq-grid">
        <div>
          <Reveal>
            <p className="landing-eyebrow">05 / FAQ</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              id="faq-heading"
              className="landing-section-heading mt-4 max-w-sm text-balance"
            >
              Questions before you start?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="landing-section-subheading mt-4 max-w-sm">
              Everything you need to know before opening the scanner.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} from="right" className="landing-faq-list">
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              open={openIndex === i}
              onToggle={() => setOpenIndex((prev) => (prev === i ? null : i))}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
