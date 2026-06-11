import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/image";
import { inr } from "@/lib/format";
import { Artwork } from "@/lib/types";
import { logger } from "@/lib/log";
import HeroCanvas from "@/components/HeroCanvas";
import Reveal from "@/components/Reveal";
import ArtCard from "@/components/ArtCard";

export const revalidate = 0; // always fresh; status changes immediately

const log = logger("page:gallery");

export default async function GalleryPage() {
  const supabase = createClient();
  log.step("loading gallery artworks");
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) log.error("artworks query failed", error);
  else log.info("artworks loaded", { count: (data ?? []).length });

  const artworks = (data ?? []) as Artwork[];
  const availableCount = artworks.filter(
    (a) => a.status === "available"
  ).length;

  return (
    <div>
      {/* ——— Hero ——— */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <HeroCanvas />
        {/* Floor glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" />

        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center sm:px-6">
          <Reveal>
            <p className="eyebrow mb-6">A private collection · for sale</p>
          </Reveal>
          <Reveal delay={0.15}>
            <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-ink sm:text-7xl">
              Original works,
              <br />
              <span className="text-accent">one of one.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="mx-auto mt-7 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Paintings and works on paper from a single studio. Each piece
              exists exactly once — when it sells, it&apos;s gone for good.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#collection" className="btn-primary">
                View the collection
              </a>
              {availableCount > 0 && (
                <span className="text-xs text-faint">
                  {availableCount}{" "}
                  {availableCount === 1 ? "piece" : "pieces"} currently
                  available
                </span>
              )}
            </div>
          </Reveal>
        </div>

        {/* Scroll cue */}
        <a
          href="#collection"
          aria-label="Scroll to collection"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <span className="block h-10 w-px overflow-hidden bg-line">
            <span className="block h-1/2 w-px animate-[scrollcue_1.8s_ease-in-out_infinite] bg-accent" />
          </span>
        </a>
      </section>

      {/* ——— Collection ——— */}
      <section
        id="collection"
        className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-24 pt-20 sm:px-6"
      >
        <Reveal>
          <div className="mb-12 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">The collection</p>
              <h2 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
                Currently in the studio
              </h2>
            </div>
            <p className="hidden text-sm text-faint sm:block">
              {artworks.length} {artworks.length === 1 ? "work" : "works"}
            </p>
          </div>
        </Reveal>

        {error && (
          <div className="card border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            <p className="font-medium">Could not load artworks.</p>
            <p className="mt-1">{error.message}</p>
            <p className="mt-2 text-red-400">
              If the table is missing, run
              <code className="mx-1">supabase/migrations/0001_init.sql</code>
              in the Supabase SQL Editor.
            </p>
          </div>
        )}

        {!error && artworks.length === 0 && (
          <p className="text-muted">
            The studio is between collections — check back soon.
          </p>
        )}

        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {artworks.map((art, i) => (
            <ArtCard
              key={art.id}
              id={art.id}
              title={art.title}
              priceLabel={inr(art.price_inr)}
              status={art.status}
              imageUrl={publicImageUrl(art.image_path)}
              index={i}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
