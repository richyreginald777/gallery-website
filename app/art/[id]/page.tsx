import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/image";
import { inr } from "@/lib/format";
import { Artwork } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import Reveal from "@/components/Reveal";
import ZoomImage from "@/components/ZoomImage";

export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!data) return { title: "Artwork — The Gallery" };
  const art = data as Artwork;
  const img = publicImageUrl(art.image_path);
  const desc =
    art.description?.slice(0, 155) ||
    `${art.title} — an original, one-of-a-kind work${
      art.medium ? ` in ${art.medium}` : ""
    }.`;
  return {
    title: `${art.title} — The Gallery`,
    description: desc,
    openGraph: {
      title: art.title,
      description: desc,
      type: "website",
      images: img ? [{ url: img, alt: art.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: art.title,
      description: desc,
      images: img ? [img] : undefined,
    },
  };
}

export default async function ArtworkPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const art = data as Artwork;
  const url = publicImageUrl(art.image_path);
  const buyable = art.status === "available";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: art.title,
    description: art.description ?? undefined,
    image: url ?? undefined,
    category: "Original Artwork",
    material: art.medium ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: art.price_inr,
      availability: buyable
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Reveal>
        <Link href="/#collection" className="link-quiet text-sm">
          ← Back to the collection
        </Link>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-16">
        {/* Image */}
        <div>
          {url ? (
            <ZoomImage
              src={url}
              alt={art.title}
              caption={[art.medium, art.dimensions]
                .filter(Boolean)
                .join(" · ")}
            />
          ) : (
            <div className="card flex aspect-[4/5] items-center justify-center text-faint">
              No image
            </div>
          )}
        </div>

        {/* Details — sticky purchase rail on desktop */}
        <div className="md:sticky md:top-28 md:self-start md:pt-2">
          <Reveal>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <StatusBadge status={art.status} />
              <span className="eyebrow">One of one</span>
            </div>
            <h1 className="font-serif text-step-2 leading-[1.05] tracking-tight text-ink">
              {art.title}
            </h1>
            <p className="mt-4 text-2xl tabular-nums text-accent">
              {inr(art.price_inr)}
            </p>
          </Reveal>

          {art.description && (
            <Reveal delay={0.1}>
              <p className="mt-7 whitespace-pre-line leading-relaxed text-muted">
                {art.description}
              </p>
            </Reveal>
          )}

          <Reveal delay={0.15}>
            <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
              {art.medium && (
                <div className="flex gap-4 py-3">
                  <dt className="w-28 shrink-0 text-faint">Medium</dt>
                  <dd className="text-ink">{art.medium}</dd>
                </div>
              )}
              {art.dimensions && (
                <div className="flex gap-4 py-3">
                  <dt className="w-28 shrink-0 text-faint">Dimensions</dt>
                  <dd className="text-ink">{art.dimensions}</dd>
                </div>
              )}
              <div className="flex gap-4 py-3">
                <dt className="w-28 shrink-0 text-faint">Edition</dt>
                <dd className="text-ink">Original — no prints, no copies</dd>
              </div>
              <div className="flex gap-4 py-3">
                <dt className="w-28 shrink-0 text-faint">Provenance</dt>
                <dd className="text-ink">Direct from the artist&apos;s studio</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-9">
              {buyable ? (
                <>
                  <Link
                    href={`/checkout/${art.id}`}
                    className="btn-primary w-full sm:w-auto sm:px-12"
                  >
                    Acquire this piece
                  </Link>
                  <p className="mt-3 text-xs text-faint">
                    Secure UPI payment via Razorpay. The piece is held for you
                    for 15 minutes at checkout.
                  </p>
                </>
              ) : (
                <button disabled className="btn-ghost w-full sm:w-auto">
                  {art.status === "sold"
                    ? "Sold — in a private collection"
                    : "Reserved — payment in progress"}
                </button>
              )}
            </div>
          </Reveal>

          {/* Trust row */}
          <Reveal delay={0.25}>
            <div className="mt-10 grid grid-cols-3 gap-3 text-center">
              {[
                ["Authentic", "Signed original"],
                ["Insured", "Shipped with care"],
                ["Tracked", "Door-to-door"],
              ].map(([t, s]) => (
                <div
                  key={t}
                  className="rounded-lg border border-line bg-surface/60 px-2 py-3"
                >
                  <p className="text-xs font-medium text-ink">{t}</p>
                  <p className="mt-0.5 text-[0.68rem] leading-tight text-faint">
                    {s}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
