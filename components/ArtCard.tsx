"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import StatusBadge from "@/components/StatusBadge";
import type { ArtworkStatus } from "@/lib/types";

export type ArtCardProps = {
  id: string;
  title: string;
  priceLabel: string;
  status: ArtworkStatus;
  imageUrl: string | null;
  index?: number;
};

/** Museum-label style card with a slow, deliberate hover. */
export default function ArtCard({
  id,
  title,
  priceLabel,
  status,
  imageUrl,
  index = 0,
}: ArtCardProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.8,
        delay: (index % 3) * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link href={`/art/${id}`} className="group block">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border border-line bg-surface">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-gallery group-hover:scale-[1.045]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-faint">
              No image
            </div>
          )}
          {/* Soft vignette that lifts on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/50 via-transparent to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-20" />
          <div className="absolute left-3 top-3">
            <StatusBadge status={status} />
          </div>
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
        <div className="mx-1 mt-3 h-px w-full bg-line">
          <div className="h-px w-0 bg-accent transition-all duration-700 ease-gallery group-hover:w-full" />
        </div>
      </Link>
    </motion.div>
  );
}
