"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before this element starts animating in. */
  delay?: number;
  /** Direction the element travels from as it fades in. */
  from?: "bottom" | "left" | "right" | "none";
};

const OFFSET = 20;

function getOffset(from: RevealProps["from"]) {
  if (from === "left") return { x: -OFFSET, y: 0 };
  if (from === "right") return { x: OFFSET, y: 0 };
  if (from === "none") return { x: 0, y: 0 };
  return { x: 0, y: OFFSET };
}

// Scroll-triggered fade/slide used across every landing section. `once`
// keeps it from re-firing when scrolling back up, and the whole transform
// collapses to a plain fade when the visitor prefers reduced motion.
export function Reveal({ children, className, delay = 0, from = "bottom" }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const offset = getOffset(from);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...(reduceMotion ? {} : offset),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.2 : 0.5,
        delay: reduceMotion ? 0 : delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's entrance. */
  stagger?: number;
};

// Parent wrapper for grids/lists — children animate in sequence rather
// than all at once. Pair with <StaggerItem> for each child.
export function Stagger({ children, className, stagger = 0.08 }: StaggerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: reduceMotion ? 0 : stagger },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : OFFSET },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: reduceMotion ? 0.2 : 0.45,
            ease: [0.21, 0.47, 0.32, 0.98],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
