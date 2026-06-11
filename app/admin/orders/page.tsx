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

const BADGE: Record<string, string> = {
  paid: "border-emerald-700/50 bg-emerald-950/60 text-emerald-300",
  shipped: "border-sky-700/50 bg-sky-950/60 text-sky-300",
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
        <h1 className="mb-7 font-serif text-3xl tracking-tight text-ink">
          Orders
        </h1>
        <div className="card border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          <p className="font-medium">Could not load orders.</p>
          <p className="mt-1">{error.message}</p>
          <p className="mt-2 text-red-400">
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
      <h1 className="mb-7 font-serif text-3xl tracking-tight text-ink">
        Orders
      </h1>

      {orders.length === 0 && (
        <p className="text-sm text-faint">No orders yet.</p>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <div
            key={o.id}
            className="card p-4 text-sm transition-colors duration-300 hover:border-accent/30"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-ink">
                {o.artworks?.title ?? "Artwork"}
              </p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs capitalize ${
                  BADGE[o.status] ?? "border-line bg-raise text-muted"
                }`}
              >
                {o.status}
              </span>
            </div>
            <p className="mt-1 text-muted">
              {inr(o.amount_inr)} · {new Date(o.created_at).toLocaleString()}
            </p>
            {o.shipping_snapshot && (
              <p className="mt-1 text-xs text-faint">
                Ship to: {o.shipping_snapshot}
              </p>
            )}
            {o.utr && (
              <p className="mt-1 text-xs text-faint">UTR/RRN: {o.utr}</p>
            )}
            {o.razorpay_payment_id && (
              <p className="text-xs text-faint">
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
