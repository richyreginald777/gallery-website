import { createAdminClient } from "@/lib/supabase/admin";
import { inr } from "@/lib/format";
import { Order } from "@/lib/types";
import { logger } from "@/lib/log";
import ShipButton from "./ShipButton";

export const revalidate = 0;

const log = logger("page:admin/orders");

type Row = Order & {
  artworks: { title: string } | null;
};

export default async function OrdersPage() {
  const admin = createAdminClient();
  log.step("loading orders");
  const { data, error } = await admin
    .from("orders")
    .select("*, artworks(title)")
    .order("created_at", { ascending: false });

  if (error) {
    // Most common cause: tables don't exist yet (migration not run).
    log.error("orders query failed", error);
    return (
      <div>
        <h1 className="font-serif text-2xl mb-6">Orders</h1>
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">Could not load orders.</p>
          <p className="mt-1">{error.message}</p>
          <p className="mt-2 text-red-600">
            If this says the table is missing, run the migration in
            <code className="mx-1">supabase/migrations/0001_init.sql</code>
            via the Supabase SQL Editor.
          </p>
        </div>
      </div>
    );
  }

  const orders = (data ?? []) as Row[];
  log.info("orders loaded", { count: orders.length });

  return (
    <div>
      <h1 className="font-serif text-2xl mb-6">Orders</h1>

      {orders.length === 0 && (
        <p className="text-sm text-neutral-500">No orders yet.</p>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className="rounded border border-neutral-200 bg-white p-4 text-sm"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{o.artworks?.title ?? "Artwork"}</p>
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs capitalize">
                {o.status}
              </span>
            </div>
            <p className="mt-1 text-neutral-500">
              {inr(o.amount_inr)} · {new Date(o.created_at).toLocaleString()}
            </p>
            {o.shipping_snapshot && (
              <p className="mt-1 text-xs text-neutral-500">
                Ship to: {o.shipping_snapshot}
              </p>
            )}
            {o.utr && (
              <p className="mt-1 text-xs text-neutral-400">UTR/RRN: {o.utr}</p>
            )}
            {o.razorpay_payment_id && (
              <p className="text-xs text-neutral-400">
                Payment: {o.razorpay_payment_id}
              </p>
            )}
            {o.status === "paid" && <ShipButton orderId={o.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
