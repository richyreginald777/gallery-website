"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";

/**
 * Oversized words that drift horizontally as the section scrolls through
 * the viewport — kinetic typography that reads as texture, not noise.
 */
export default function ScrollMarquee({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["6%", "-18%"]);

  const word = (
    <span className="px-[0.25em] font-serif italic text-ink/[0.04]">
      {text}
    </span>
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none select-none overflow-hidden ${className}`}
    >
      <motion.div
        style={reduced ? undefined : { x }}
        className="flex whitespace-nowrap text-[clamp(4rem,16vw,13rem)] leading-none"
      >
        {word}
        {word}
        {word}
      </motion.div>
    </div>
  );
}
