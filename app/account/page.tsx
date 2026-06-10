import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { inr } from "@/lib/format";
import { Address, Order } from "@/lib/types";
import AddressForm from "./AddressForm";
import AddressCard from "./AddressCard";
import { signOut } from "./actions";

export const revalidate = 0;

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const [{ data: addresses }, { data: orders }] = await Promise.all([
    supabase
      .from("addresses")
      .select("*")
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("created_at"),
    supabase
      .from("orders")
      .select("*, artworks(title)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl">Your account</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-neutral-500 underline">Sign out</button>
        </form>
      </div>

      <section>
        <h2 className="font-serif text-xl mb-4">Saved addresses</h2>
        <div className="mb-4 space-y-2">
          {(addresses as Address[] | null)?.map((a) => (
            <AddressCard key={a.id} address={a} />
          ))}
          {(!addresses || addresses.length === 0) && (
            <p className="text-sm text-neutral-500">No addresses saved yet.</p>
          )}
        </div>
        <AddressForm />
      </section>

      <section>
        <h2 className="font-serif text-xl mb-4">Order history</h2>
        <div className="space-y-2">
          {(orders as (Order & { artworks: { title: string } })[] | null)?.map(
            (o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded border border-neutral-200 bg-white p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{o.artworks?.title ?? "Artwork"}</p>
                  <p className="text-neutral-500">
                    {inr(o.amount_inr)} · {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs capitalize">
                  {o.status}
                </span>
              </div>
            )
          )}
          {(!orders || orders.length === 0) && (
            <p className="text-sm text-neutral-500">
              No orders yet.{" "}
              <Link href="/" className="underline">
                Browse the gallery
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
