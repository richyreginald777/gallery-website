"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type LightboxItem = {
  src: string;
  alt: string;
  caption?: string;
};

/**
 * Full-screen image viewer.
 * - Keyboard: ← → navigate, + / - / 0 zoom, Esc close
 * - Mouse: wheel to zoom, drag to pan when zoomed
 * - Touch: pinch to zoom, drag to pan, swipe to navigate
 */
export default function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange?: (i: number) => void;
}) {
  const open = index !== null;
  const i = index ?? 0;
  const item = items[i];

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(
    null
  );
  const pinch = useRef<{ d: number; z: number } | null>(null);
  const swipeStart = useRef<{ x: number; t: number } | null>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const go = useCallback(
    (dir: number) => {
      if (!onIndexChange || items.length < 2) return;
      const next = (i + dir + items.length) % items.length;
      reset();
      onIndexChange(next);
    },
    [i, items.length, onIndexChange, reset]
  );

  useEffect(() => {
    if (!open) return;
    reset();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.5, 5));
      else if (e.key === "-") setZoom((z) => Math.max(z - 0.5, 1));
      else if (e.key === "0") reset();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  if (!open || !item) return null;

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(Math.max(z - e.deltaY * 0.0015, 1), 5));
  }

  function onDoubleClick() {
    if (zoom > 1) reset();
    else setZoom(2.2);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (zoom <= 1) {
      swipeStart.current = { x: e.clientX, t: Date.now() };
      return;
    }
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPan({
      x: drag.current.px + (e.clientX - drag.current.x),
      y: drag.current.py + (e.clientY - drag.current.y),
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (drag.current) {
      drag.current = null;
      return;
    }
    if (swipeStart.current) {
      const dx = e.clientX - swipeStart.current.x;
      const dt = Date.now() - swipeStart.current.t;
      if (Math.abs(dx) > 60 && dt < 600) go(dx < 0 ? 1 : -1);
      swipeStart.current = null;
    }
  }

  // Touch pinch
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!pinch.current) {
      pinch.current = { d, z: zoom };
    } else {
      setZoom(Math.min(Math.max((pinch.current.z * d) / pinch.current.d, 1), 5));
    }
  }
  function onTouchEnd() {
    pinch.current = null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-bg/95 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => {
          if (e.target === e.currentTarget && zoom <= 1) onClose();
        }}
      >
        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-8">
          <span className="text-xs tracking-widest2 text-faint">
            {items.length > 1 ? `${i + 1} / ${items.length}` : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.5, 1))}
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:text-ink"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="w-12 text-center text-xs tabular-nums text-faint">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.5, 5))}
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:text-ink"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              onClick={onClose}
              className="ml-2 grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:text-ink"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Prev / Next */}
        {items.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg/40 text-muted backdrop-blur-sm transition-colors hover:text-ink sm:left-6"
            >
              ←
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-bg/40 text-muted backdrop-blur-sm transition-colors hover:text-ink sm:right-6"
            >
              →
            </button>
          </>
        )}

        {/* Image stage */}
        <motion.div
          key={item.src}
          className="flex h-full w-full items-center justify-center p-6 sm:p-16"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onWheel={onWheel}
          onDoubleClick={onDoubleClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ cursor: zoom > 1 ? "grab" : "zoom-in", touchAction: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={item.alt}
            draggable={false}
            className="max-h-full max-w-full select-none rounded-md object-contain shadow-2xl"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: drag.current ? "none" : "transform 0.25s ease-out",
            }}
          />
        </motion.div>

        {item.caption && (
          <p className="absolute inset-x-0 bottom-5 text-center text-xs text-faint">
            {item.caption}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
