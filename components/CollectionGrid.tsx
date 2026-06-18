"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ArtCard from "@/components/ArtCard";
import type { ArtworkStatus } from "@/lib/types";

export type CollectionItem = {
  id: string;
  title: string;
  priceLabel: string;
  priceValue: number;
  status: ArtworkStatus;
  imageUrl: string | null;
  medium: string | null;
};

type Filter = "all" | "available" | "sold";
type Sort = "newest" | "price-asc" | "price-desc";
type View = "grid" | "masonry";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All works" },
  { key: "available", label: "Available" },
  { key: "sold", label: "Sold" },
];

const SORTS: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
];

export default function CollectionGrid({
  items,
}: {
  items: CollectionItem[];
}) {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<View>("grid");

  const counts = useMemo(
    () => ({
      all: items.length,
      available: items.filter((a) => a.status === "available").length,
      sold: items.filter((a) => a.status === "sold").length,
    }),
    [items]
  );

  const shown = useMemo(() => {
    let list = items.filter((a) => {
      if (filter === "available") return a.status === "available";
      if (filter === "sold") return a.status === "sold";
      return true;
    });
    if (sort === "price-asc")
      list = [...list].sort((a, b) => a.priceValue - b.priceValue);
    else if (sort === "price-desc")
      list = [...list].sort((a, b) => b.priceValue - a.priceValue);
    return list;
  }, [items, filter, sort]);

  return (
    <div>
      {/* Control bar */}
      <div className="sticky top-[68px] z-30 -mx-5 mb-10 border-y border-line bg-bg/70 px-5 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`chip ${filter === f.key ? "chip-on" : "chip-off"}`}
              >
                {f.label}
                <span className="text-faint">{counts[f.key]}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                aria-label="Sort works"
                className="cursor-pointer appearance-none rounded-full border border-line bg-transparent py-1.5 pl-3.5 pr-8 text-[0.78rem] text-muted transition-colors hover:border-accent/40 hover:text-ink focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key} className="bg-surface text-ink">
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint">
                ▾
              </span>
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-full border border-line p-0.5">
              {(["grid", "masonry"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  aria-label={`${v} view`}
                  className={`grid h-7 w-8 place-items-center rounded-full transition-colors duration-300 ${
                    view === v ? "bg-ink text-bg" : "text-muted hover:text-ink"
                  }`}
                >
                  {v === "grid" ? (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="0" y="0" width="7" height="7" rx="1" />
                      <rect x="9" y="0" width="7" height="7" rx="1" />
                      <rect x="0" y="9" width="7" height="7" rx="1" />
                      <rect x="9" y="9" width="7" height="7" rx="1" />
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="0" y="0" width="7" height="9" rx="1" />
                      <rect x="9" y="0" width="7" height="5" rx="1" />
                      <rect x="0" y="11" width="7" height="5" rx="1" />
                      <rect x="9" y="7" width="7" height="9" rx="1" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-muted">
          No works in this view right now.
        </p>
      ) : view === "masonry" ? (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
          {shown.map((art, idx) => (
            <ArtCard key={art.id} {...art} index={idx} masonry />
          ))}
        </div>
      ) : (
        <motion.div
          layout={!reduced}
          className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {shown.map((art, idx) => (
              <motion.div
                key={art.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <ArtCard {...art} index={idx} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
