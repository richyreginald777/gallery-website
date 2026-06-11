"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Artwork image with a click-to-expand lightbox.
 * Tap anywhere (or press Escape) to close.
 */
export default function ZoomImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View ${alt} full screen`}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-lg border border-line bg-surface"
        initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="aspect-[4/5] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-700 ease-gallery group-hover:scale-[1.03]"
          />
        </div>
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-line bg-bg/70 px-3 py-1 text-[0.7rem] text-muted opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          Click to expand
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex cursor-zoom-out items-center justify-center bg-bg/95 p-4 backdrop-blur-sm sm:p-10"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.img
              src={src}
              alt={alt}
              className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
              initial={reduced ? { scale: 1 } : { scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={reduced ? { scale: 1 } : { scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
            <button
              type="button"
              aria-label="Close"
              className="absolute right-5 top-5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
              Close ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
