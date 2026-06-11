import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { inr } from "@/lib/format";
import { Address, Order } from "@/lib/types";
import AddressForm from "./AddressForm";
import AddressCard from "./AddressCard";
import { signOut } from "./actions";

export const revalidate = 0;

const ORDER_BADGE: Record<string, string> = {
  paid: "border-emerald-700/50 bg-emerald-950/60 text-emerald-300",
  shipped: "border-sky-700/50 bg-sky-950/60 text-sky-300",
};

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
    <div className="page space-y-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Collector</p>
          <h1 className="font-serif text-3xl tracking-tight text-ink sm:text-4xl">
            Your account
          </h1>
          <p className="mt-1 text-sm text-faint">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="link-quiet text-sm">Sign out</button>
        </form>
      </div>

      <section>
        <h2 className="mb-5 font-serif text-xl text-ink">Saved addresses</h2>
        <div className="mb-5 space-y-3">
          {(addresses as Address[] | null)?.map((a) => (
            <AddressCard key={a.id} address={a} />
          ))}
          {(!addresses || addresses.length === 0) && (
            <p className="text-sm text-faint">No addresses saved yet.</p>
          )}
        </div>
        <AddressForm />
      </section>

      <section>
        <h2 className="mb-5 font-serif text-xl text-ink">Order history</h2>
        <div className="space-y-3">
          {(orders as (Order & { artworks: { title: string } })[] | null)?.map(
            (o) => (
              <div
                key={o.id}
                className="card flex items-center justify-between p-4 text-sm transition-colors duration-300 hover:border-accent/30"
              >
                <div>
                  <p className="font-medium text-ink">
                    {o.artworks?.title ?? "Artwork"}
                  </p>
                  <p className="mt-0.5 text-faint">
                    {inr(o.amount_inr)} ·{" "}
                    {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${
                    ORDER_BADGE[o.status] ?? "border-line bg-raise text-muted"
                  }`}
                >
                  {o.status}
                </span>
              </div>
            )
          )}
          {(!orders || orders.length === 0) && (
            <p className="text-sm text-faint">
              No orders yet.{" "}
              <Link href="/#collection" className="link-quiet">
                Browse the collection
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
