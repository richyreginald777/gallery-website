"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import type { ArtworkStatus } from "@/lib/types";

export type ArtCardProps = {
  id: string;
  title: string;
  priceLabel: string;
  status: ArtworkStatus;
  imageUrl: string | null;
  medium?: string | null;
  index?: number;
  /** masonry uses natural aspect; grid forces 4:5 */
  masonry?: boolean;
};

/**
 * Museum-label card with a subtle pointer-tracked tilt + spotlight.
 * Falls back to a still card under prefers-reduced-motion.
 */
export default function ArtCard({
  id,
  title,
  priceLabel,
  status,
  imageUrl,
  medium,
  index = 0,
  masonry = false,
}: ArtCardProps) {
  const reduced = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  function onMove(e: React.MouseEvent) {
    if (reduced || !frameRef.current) return;
    const el = frameRef.current;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--rx", `${(0.5 - py) * 5}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 5}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  }

  function onLeave() {
    if (!frameRef.current) return;
    frameRef.current.style.setProperty("--rx", "0deg");
    frameRef.current.style.setProperty("--ry", "0deg");
  }

  const sold = status === "sold";

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.85,
        delay: (index % 3) * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={masonry ? "mb-6 break-inside-avoid" : ""}
    >
      <Link href={`/art/${id}`} className="group block [perspective:1200px]">
        <div
          ref={frameRef}
          onMouseMove={onMove}
          onMouseLeave={onLeave}
          className="relative overflow-hidden rounded-xl border border-line bg-surface transition-shadow duration-500 ease-gallery [transform-style:preserve-3d] group-hover:shadow-lift"
          style={{
            transform:
              "rotateX(var(--rx,0)) rotateY(var(--ry,0)) translateZ(0)",
            transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className="relative aspect-[4/5] w-full">
            {imageUrl ? (
              <>
                {/* Shimmer skeleton until the image decodes — no layout shift */}
                {!loaded && (
                  <div className="absolute inset-0 overflow-hidden bg-raise">
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-line/60 to-transparent" />
                  </div>
                )}
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={index === 0}
                  onLoad={() => setLoaded(true)}
                  className={`object-cover transition-all duration-[900ms] ease-gallery group-hover:scale-[1.05] ${
                    loaded ? "opacity-100" : "opacity-0"
                  } ${sold ? "opacity-80 grayscale-[0.2]" : ""}`}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-faint">
                No image
              </div>
            )}
          </div>

          {/* Pointer spotlight */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgb(var(--accent) / 0.16), transparent 60%)",
            }}
          />
          {/* Vignette that lifts on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/55 via-transparent to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-25" />

          <div className="absolute left-3 top-3">
            <StatusBadge status={status} />
          </div>

          {/* View affordance */}
          <span className="pointer-events-none absolute bottom-3 right-3 translate-y-2 rounded-full border border-line bg-bg/70 px-3 py-1 text-[0.7rem] text-muted opacity-0 backdrop-blur-sm transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            View piece →
          </span>
        </div>

        {/* Museum label */}
        <div className="flex items-baseline justify-between gap-3 px-1 pt-4">
          <h2 className="font-serif text-lg leading-snug text-ink transition-colors duration-300 group-hover:text-accent">
            {title}
          </h2>
          <p className="shrink-0 text-sm tabular-nums text-muted">
            {priceLabel}
          </p>
        </div>
        {medium && (
          <p className="px-1 pt-1 text-xs text-faint">{medium}</p>
        )}
        <div className="mx-1 mt-3 h-px w-full bg-line">
          <div className="h-px w-0 bg-accent transition-all duration-700 ease-gallery group-hover:w-full" />
        </div>
      </Link>
    </motion.div>
  );
}
