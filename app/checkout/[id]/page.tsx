import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { inr } from "@/lib/format";
import { Artwork, Address } from "@/lib/types";
import { startCheckout } from "./actions";

export const revalidate = 0;

export default async function CheckoutPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/checkout/${params.id}`);

  const { data: art } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!art) notFound();
  const artwork = art as Artwork;

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .order("created_at");
  const addrs = (addresses ?? []) as Address[];
  const shipping = addrs.filter((a) => a.kind === "shipping");
  const billing = addrs.filter((a) => a.kind === "billing");

  if (artwork.status !== "available") {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-serif text-2xl mb-2">{artwork.title}</h1>
        <p className="mb-6 text-neutral-600">
          This piece is no longer available.
        </p>
        <Link href="/" className="underline">
          Back to gallery
        </Link>
      </div>
    );
  }

  if (addrs.length === 0) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-serif text-2xl mb-2">Add an address first</h1>
        <p className="mb-6 text-neutral-600">
          You need a shipping address before checking out.
        </p>
        <Link href="/account" className="underline">
          Go to your account
        </Link>
      </div>
    );
  }

  const select =
    "w-full rounded border border-neutral-300 px-3 py-2 text-sm";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-serif text-2xl mb-1">Checkout</h1>
      <p className="mb-6 text-neutral-600">
        {artwork.title} — <strong>{inr(artwork.price_inr)}</strong>
      </p>

      <form action={startCheckout} className="space-y-4">
        <input type="hidden" name="artwork_id" value={artwork.id} />

        <label className="block text-sm">
          <span className="mb-1 block text-neutral-500">Shipping address</span>
          <select name="shipping_address_id" className={select} required>
            {(shipping.length ? shipping : addrs).map((a) => (
              <option key={a.id} value={a.id}>
                {a.line1}, {a.city} {a.postal_code}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-neutral-500">
            Billing address
          </span>
          <select name="billing_address_id" className={select} required>
            {(billing.length ? billing : addrs).map((a) => (
              <option key={a.id} value={a.id}>
                {a.line1}, {a.city} {a.postal_code}
              </option>
            ))}
          </select>
        </label>

        <button className="w-full rounded bg-neutral-900 px-4 py-3 text-white">
          Pay {inr(artwork.price_inr)} via UPI
        </button>
        <p className="text-center text-xs text-neutral-400">
          You&apos;ll be taken to a secure Razorpay page. Payment is confirmed
          automatically — no manual reference number needed.
        </p>
      </form>
    </div>
  );
}
