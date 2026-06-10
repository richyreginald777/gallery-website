import Link from "next/link";

// Razorpay redirects the buyer here after paying. The actual status change
// is driven by the webhook (source of truth), so this page just reassures.
export default function CheckoutReturn({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="font-serif text-2xl mb-3">Thank you</h1>
      <p className="mb-6 text-neutral-600">
        If your payment succeeded, your order is being confirmed automatically.
        It may take a few seconds to appear as <strong>Paid</strong> in your
        order history.
      </p>
      <Link href="/account" className="underline">
        View your orders
      </Link>
    </div>
  );
}
