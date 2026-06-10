import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/image";
import { inr } from "@/lib/format";
import { Artwork } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

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
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-lg bg-neutral-100">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={art.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">
            No image
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center gap-3">
          <h1 className="font-serif text-3xl">{art.title}</h1>
          <StatusBadge status={art.status} />
        </div>

        <p className="mb-6 text-2xl">{inr(art.price_inr)}</p>

        {art.description && (
          <p className="mb-6 whitespace-pre-line text-neutral-700">
            {art.description}
          </p>
        )}

        <dl className="mb-8 space-y-1 text-sm text-neutral-600">
          {art.medium && (
            <div className="flex gap-2">
              <dt className="w-28 text-neutral-400">Medium</dt>
              <dd>{art.medium}</dd>
            </div>
          )}
          {art.dimensions && (
            <div className="flex gap-2">
              <dt className="w-28 text-neutral-400">Dimensions</dt>
              <dd>{art.dimensions}</dd>
            </div>
          )}
        </dl>

        {buyable ? (
          <Link
            href={`/checkout/${art.id}`}
            className="inline-block rounded bg-neutral-900 px-6 py-3 text-white hover:bg-neutral-700"
          >
            Buy now
          </Link>
        ) : (
          <button
            disabled
            className="inline-block cursor-not-allowed rounded bg-neutral-200 px-6 py-3 text-neutral-500"
          >
            {art.status === "sold" ? "Sold" : "Reserved"}
          </button>
        )}
      </div>
    </div>
  );
}
