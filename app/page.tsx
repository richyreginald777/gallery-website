import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/image";
import { inr } from "@/lib/format";
import { Artwork } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { logger } from "@/lib/log";

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

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Gallery</h1>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Could not load artworks.</p>
          <p className="mt-1">{error.message}</p>
          <p className="mt-2 text-red-600">
            If the table is missing, run
            <code className="mx-1">supabase/migrations/0001_init.sql</code>
            in the Supabase SQL Editor.
          </p>
        </div>
      )}

      {!error && artworks.length === 0 && (
        <p className="text-neutral-500">No artworks yet.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((art) => {
          const url = publicImageUrl(art.image_path);
          return (
            <Link
              key={art.id}
              href={`/art/${art.id}`}
              className="group block overflow-hidden rounded-lg border border-neutral-200 bg-white transition hover:shadow-md"
            >
              <div className="aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={art.title}
                    className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-300">
                    No image
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="font-serif text-lg leading-tight">{art.title}</h2>
                  <StatusBadge status={art.status} />
                </div>
                <p className="text-sm text-neutral-600">{inr(art.price_inr)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
