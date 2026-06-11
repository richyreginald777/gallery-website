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
      <div className="page">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-3 font-serif text-3xl text-ink">
            {artwork.title}
          </h1>
          <p className="mb-8 text-muted">This piece is no longer available.</p>
          <Link href="/#collection" className="btn-ghost">
            Back to the collection
          </Link>
        </div>
      </div>
    );
  }

  if (addrs.length === 0) {
    return (
      <div className="page">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-3 font-serif text-3xl text-ink">
            Add an address first
          </h1>
          <p className="mb-8 text-muted">
            You need a shipping address before checking out.
          </p>
          <Link href="/account" className="btn-primary">
            Go to your account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="mx-auto max-w-md">
        <p className="eyebrow mb-3">Final step</p>
        <h1 className="font-serif text-3xl tracking-tight text-ink">
          Checkout
        </h1>

        <div className="card mt-6 flex items-baseline justify-between p-4 text-sm">
          <span className="text-muted">{artwork.title}</span>
          <strong className="tabular-nums text-accent">
            {inr(artwork.price_inr)}
          </strong>
        </div>

        <form action={startCheckout} className="mt-6 space-y-5">
          <input type="hidden" name="artwork_id" value={artwork.id} />

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Shipping address</span>
            <select name="shipping_address_id" className="input" required>
              {(shipping.length ? shipping : addrs).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.line1}, {a.city} {a.postal_code}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">Billing address</span>
            <select name="billing_address_id" className="input" required>
              {(billing.length ? billing : addrs).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.line1}, {a.city} {a.postal_code}
                </option>
              ))}
            </select>
          </label>

          <button className="btn-primary w-full">
            Pay {inr(artwork.price_inr)} via UPI
          </button>
          <p className="text-center text-xs leading-relaxed text-faint">
            You&apos;ll be taken to a secure Razorpay page. Payment is
            confirmed automatically — no manual reference number needed.
          </p>
        </form>
      </div>
    </div>
  );
}
