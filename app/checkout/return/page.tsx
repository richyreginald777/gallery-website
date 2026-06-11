import Link from "next/link";

// Razorpay redirects the buyer here after paying. The actual status change
// is driven by the webhook (source of truth), so this page just reassures.
export default function CheckoutReturn({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="page">
      <div className="mx-auto max-w-md text-center">
        <p className="eyebrow mb-4">Order received</p>
        <h1 className="mb-4 font-serif text-4xl tracking-tight text-ink">
          Thank you
        </h1>
        <p className="mb-9 leading-relaxed text-muted">
          If your payment succeeded, your order is being confirmed
          automatically. It may take a few seconds to appear as{" "}
          <strong className="text-ink">Paid</strong> in your order history.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/account" className="btn-primary">
            View your orders
          </Link>
          <Link href="/#collection" className="btn-ghost">
            Keep browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
