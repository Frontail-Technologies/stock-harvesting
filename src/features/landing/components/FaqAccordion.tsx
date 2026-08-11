"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

const FAQ_ITEMS = [
  {
    question: "Is Stock Harvesting a trading platform?",
    answer:
      "No. Stock Harvesting is a stock analysis and chart-review workspace. It helps you surface and inspect market behaviour, but it does not place trades on your behalf.",
  },
  {
    question: "What does Stock Harvesting surface?",
    answer:
      "Stock Harvesting uses a proprietary analysis methodology to identify relevant market behaviour and display the result directly in chart context.",
  },
  {
    question: "Can I review different historical ranges?",
    answer:
      "Yes. The workspace includes historical range controls so you can review the same stock across different periods without leaving the workspace.",
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
      "No. Stock Harvesting is a research and chart-review tool. Analysis results and historical context should be used as part of your own analysis and do not guarantee future market performance.",
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
        className="landing-faq-trigger cursor-pointer"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="landing-faq-question">{question}</span>
        <span className="landing-faq-icon" aria-hidden="true">
          {open ? "-" : "+"}
        </span>
      </button>

      <div className={cn("landing-faq-answer", open && "landing-faq-answer-open")}>
        <p className="landing-faq-answer-inner">{answer}</p>
      </div>
    </div>
  );
}

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="landing-faq-list">
      {FAQ_ITEMS.map((item, i) => (
        <FaqItem
          key={item.question}
          question={item.question}
          answer={item.answer}
          open={openIndex === i}
          onToggle={() => setOpenIndex((prev) => (prev === i ? null : i))}
        />
      ))}
    </div>
  );
}
