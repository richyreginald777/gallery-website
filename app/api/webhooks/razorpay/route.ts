import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/log";

const log = logger("webhook:razorpay");

// Razorpay webhook. MUST verify the signature against the RAW body using
// HMAC-SHA256 with the webhook secret. Do not parse before hashing.
//
// Configure in Razorpay dashboard > Settings > Webhooks:
//   URL:    https://<your-site>/api/webhooks/razorpay
//   Secret: same value as RAZORPAY_WEBHOOK_SECRET
//   Events: payment_link.paid, payment_link.expired, payment_link.cancelled

export const runtime = "nodejs"; // need raw body + crypto
export const dynamic = "force-dynamic";

function verify(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  // Constant-time compare.
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!verify(rawBody, signature)) {
    log.warn("rejected webhook: invalid signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const admin = createAdminClient();

  // The payment link entity carries our reference_id (= order id) and id.
  const pl = event?.payload?.payment_link?.entity;
  const payment = event?.payload?.payment?.entity;
  const orderId: string | undefined = pl?.reference_id ?? pl?.notes?.order_id;
  log.step("received event", { event: event.event, orderId, paymentId: payment?.id });

  if (!orderId) {
    log.warn("no orderId in payload, acking", { event: event.event });
    // Nothing actionable; ack so Razorpay stops retrying.
    return NextResponse.json({ ok: true });
  }

  // Load the order + its artwork.
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();
  if (orderErr) {
    log.error("order lookup failed", orderErr, { orderId });
    return NextResponse.json({ ok: true });
  }
  if (!order) {
    log.warn("order not found, acking", { orderId });
    return NextResponse.json({ ok: true });
  }

  switch (event.event) {
    case "payment_link.paid": {
      // Idempotent: only act if not already paid.
      if (order.status !== "paid") {
        log.step("marking order paid + artwork sold", { orderId, artworkId: order.artwork_id });
        const { error: oErr } = await admin
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            razorpay_payment_id: payment?.id ?? null,
            utr: payment?.acquirer_data?.upi_transaction_id ?? payment?.acquirer_data?.rrn ?? null,
          })
          .eq("id", order.id);
        if (oErr) log.error("failed to mark order paid", oErr, { orderId });

        // Permanently mark the artwork sold.
        const { error: aErr } = await admin
          .from("artworks")
          .update({
            status: "sold",
            reserved_by: null,
            reserved_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.artwork_id);
        if (aErr) log.error("failed to mark artwork sold", aErr, { artworkId: order.artwork_id });
        else log.info("order paid + artwork sold", { orderId, artworkId: order.artwork_id });
      } else {
        log.info("duplicate paid event ignored (already paid)", { orderId });
      }
      break;
    }

    case "payment_link.expired":
    case "payment_link.cancelled": {
      // Release the artwork only if this order still holds it and isn't paid.
      if (order.status !== "paid") {
        log.step("releasing artwork after expiry/cancel", { orderId, artworkId: order.artwork_id });
        await admin
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", order.id);
        await admin
          .from("artworks")
          .update({
            status: "available",
            reserved_by: null,
            reserved_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.artwork_id)
          .eq("status", "reserved");
        log.info("artwork released", { orderId, artworkId: order.artwork_id });
      } else {
        log.info("expiry/cancel on already-paid order ignored", { orderId });
      }
      break;
    }

    default:
      log.info("unhandled event type", { event: event.event });
  }

  return NextResponse.json({ ok: true });
}
