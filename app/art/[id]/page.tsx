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

  return (
    <div className="page">
      <Reveal>
        <Link href="/#collection" className="link-quiet text-sm">
          ← Back to the collection
        </Link>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-14">
        <div>
          {url ? (
            <ZoomImage src={url} alt={art.title} />
          ) : (
            <div className="card flex aspect-[4/5] items-center justify-center text-faint">
              No image
            </div>
          )}
        </div>

        <div className="md:pt-4">
          <Reveal>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusBadge status={art.status} />
              <span className="eyebrow">One of one</span>
            </div>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-ink sm:text-5xl">
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
            </dl>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-9">
              {buyable ? (
                <>
                  <Link
                    href={`/checkout/${art.id}`}
                    className="btn-primary w-full sm:w-auto sm:px-10"
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
        </div>
      </div>
    </div>
  );
}
