"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import Lightbox from "@/components/Lightbox";

/**
 * Artwork image with a click-to-expand, zoomable lightbox.
 * Delegates the immersive viewer to <Lightbox/> (pan / pinch / wheel zoom,
 * keyboard, swipe).
 */
export default function ZoomImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${alt} full screen`}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-line bg-surface shadow-frame"
        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover transition-transform duration-[900ms] ease-gallery group-hover:scale-[1.04]"
          />
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-line bg-bg/70 px-3 py-1 text-[0.7rem] text-muted opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          ⤢ Expand &amp; zoom
        </span>
      </motion.button>

      <Lightbox
        items={[{ src, alt, caption }]}
        index={open ? 0 : null}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
