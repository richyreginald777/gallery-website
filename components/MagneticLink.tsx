"use client";

import Link from "next/link";
import { useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * A link/button that subtly leans toward the cursor (magnetic effect),
 * then springs back on leave. Used for primary CTAs. Falls back to a plain
 * link under prefers-reduced-motion.
 */
export default function MagneticLink({
  href,
  children,
  className = "",
  strength = 0.35,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();

  function onMove(e: React.MouseEvent) {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  }
  function onLeave() {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0px, 0px)";
  }

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)" }}
    >
      {children}
    </Link>
  );
}
