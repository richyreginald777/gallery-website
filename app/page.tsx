import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/image";
import { inr } from "@/lib/format";
import { Artwork } from "@/lib/types";
import { logger } from "@/lib/log";
import HeroCanvas from "@/components/HeroCanvas";
import Reveal from "@/components/Reveal";
import CollectionGrid, { CollectionItem } from "@/components/CollectionGrid";
import MagneticLink from "@/components/MagneticLink";
import ScrollMarquee from "@/components/ScrollMarquee";

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
  const availableCount = artworks.filter((a) => a.status === "available").length;

  const items: CollectionItem[] = artworks.map((a) => ({
    id: a.id,
    title: a.title,
    priceLabel: inr(a.price_inr),
    priceValue: a.price_inr,
    status: a.status,
    imageUrl: publicImageUrl(a.image_path),
    medium: a.medium,
  }));

  return (
    <div>
      {/* ——— Hero ——— */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden">
        <HeroCanvas />
        {/* Floor glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-bg to-transparent" />

        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center sm:px-6">
          <Reveal>
            <p className="eyebrow mb-7">A private collection · for sale</p>
          </Reveal>

          {/* Oversized kinetic headline */}
          <h1 className="font-serif leading-[0.95] tracking-tight text-ink">
            <Reveal delay={0.12}>
              <span className="block text-[clamp(2.8rem,9vw,6.5rem)]">
                Original works,
              </span>
            </Reveal>
            <Reveal delay={0.26}>
              <span className="block text-[clamp(2.8rem,9vw,6.5rem)] italic text-accent">
                one of one.
              </span>
            </Reveal>
          </h1>

          <Reveal delay={0.42}>
            <p className="mx-auto mt-8 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Paintings and works on paper from a single studio. Each piece
              exists exactly once — when it sells, it&apos;s gone for good.
            </p>
          </Reveal>
          <Reveal delay={0.56}>
            <div className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <MagneticLink href="#collection" className="btn-primary">
                View the collection
              </MagneticLink>
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
        className="relative mx-auto max-w-6xl scroll-mt-20 px-5 pb-28 pt-20 sm:px-6"
      >
        {/* Kinetic ghost-type behind the heading */}
        <ScrollMarquee
          text="The Gallery"
          className="absolute inset-x-0 top-8 -z-0"
        />

        <Reveal>
          <div className="relative z-10 mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">The collection</p>
              <h2 className="font-serif text-step-2 tracking-tight text-ink">
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

        {!error && artworks.length > 0 && <CollectionGrid items={items} />}
      </section>
    </div>
  );
}
