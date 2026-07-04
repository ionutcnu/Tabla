"use client";

import type { ReactNode } from "react";
import { AnimatePresence, domAnimation, LazyMotion, m, MotionConfig, type HTMLMotionProps } from "motion/react";

const viewport = { amount: 0.18, once: true } as const;
const smooth = { duration: 0.45, ease: [0.22, 1, 0.36, 1] } as const;

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={smooth}>
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  );
}

export function FadeInDiv({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 18 }}
      transition={{ ...smooth, delay }}
      viewport={viewport}
      whileInView={{ opacity: 1, y: 0 }}
      {...props}
    />
  );
}

export function FadeInSection({ delay = 0, ...props }: HTMLMotionProps<"section"> & { delay?: number }) {
  return (
    <m.section
      initial={{ opacity: 0, y: 18 }}
      transition={{ ...smooth, delay }}
      viewport={viewport}
      whileInView={{ opacity: 1, y: 0 }}
      {...props}
    />
  );
}

export function FadeInArticle({ delay = 0, ...props }: HTMLMotionProps<"article"> & { delay?: number }) {
  return (
    <m.article
      initial={{ opacity: 0, y: 18 }}
      transition={{ ...smooth, delay }}
      viewport={viewport}
      whileInView={{ opacity: 1, y: 0 }}
      {...props}
    />
  );
}

export function StaggerDiv(props: HTMLMotionProps<"div">) {
  return (
    <m.div
      initial="hidden"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      viewport={viewport}
      whileInView="show"
      {...props}
    />
  );
}

export function StaggerItemArticle(props: HTMLMotionProps<"article">) {
  return (
    <m.article
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: smooth } }}
      whileHover={{ y: -4 }}
      {...props}
    />
  );
}

export { AnimatePresence, m };
