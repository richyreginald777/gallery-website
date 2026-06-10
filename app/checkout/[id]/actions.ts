"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { razorpay } from "@/lib/razorpay";
import { Artwork, Address } from "@/lib/types";
import { logger } from "@/lib/log";

const RESERVE_MINUTES = 15;
const log = logger("checkout");

function formatAddress(a: Address | null | undefined): string | null {
  if (!a) return null;
  return [
    a.line1,
    a.line2,
    `${a.city}${a.state ? ", " + a.state : ""} ${a.postal_code}`,
    a.country,
  ]
    .filter(Boolean)
    .join(", ");
}

// Reserve the artwork (atomic), create an order row, then create a Razorpay
// UPI payment link and redirect the buyer to it.
export async function startCheckout(formData: FormData) {
  const artworkId = formData.get("artwork_id") as string;
  const shippingId = formData.get("shipping_address_id") as string;
  const billingId = formData.get("billing_address_id") as string;
  log.step("startCheckout invoked", { artworkId, shippingId, billingId });

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    log.info("no session, redirecting to login", { artworkId });
    redirect(`/login?next=/checkout/${artworkId}`);
  }

  const admin = createAdminClient();

  // Load the artwork (service role; price is authoritative server-side).
  log.step("loading artwork", { artworkId });
  const { data: artData, error: artErr } = await admin
    .from("artworks")
    .select("*")
    .eq("id", artworkId)
    .single();
  if (artErr) {
    log.error("artwork lookup failed", artErr, { artworkId });
    throw new Error(`Artwork lookup failed: ${artErr.message}`);
  }
  if (!artData) {
    log.warn("artwork not found", { artworkId });
    throw new Error("Artwork not found.");
  }
  const art = artData as Artwork;
  log.info("artwork loaded", { artworkId, title: art.title, status: art.status });

  // ---- Atomic reservation: closes the inventory-freeze exploit ----
  // reserve_artwork() only succeeds if available OR a prior hold has lapsed.
  log.step("reserving artwork", { artworkId, userId: user.id, minutes: RESERVE_MINUTES });
  const { data: reserved, error: reserveErr } = await admin.rpc(
    "reserve_artwork",
    { p_artwork: artworkId, p_user: user.id, p_minutes: RESERVE_MINUTES }
  );
  if (reserveErr) {
    log.error("reservation rpc failed", reserveErr, { artworkId });
    throw new Error(`Reservation failed: ${reserveErr.message}`);
  }
  if (!reserved) {
    log.info("artwork unavailable for reservation", { artworkId });
    redirect(`/art/${artworkId}?error=unavailable`);
  }
  log.info("artwork reserved", { artworkId });

  // Snapshot the chosen addresses so later edits/deletes never rewrite this
  // order's record. Past orders stay accurate; future orders use whatever the
  // user picks at their checkout time.
  log.step("loading addresses for snapshot", { shippingId, billingId });
  const { data: addrRows } = await admin
    .from("addresses")
    .select("*")
    .in("id", [shippingId, billingId].filter(Boolean));
  const addrs = (addrRows ?? []) as Address[];
  const shippingSnapshot = formatAddress(addrs.find((a) => a.id === shippingId));
  const billingSnapshot = formatAddress(addrs.find((a) => a.id === billingId));

  // Create the order row.
  log.step("creating order row", { artworkId, amount: art.price_inr });
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      artwork_id: art.id,
      amount_inr: art.price_inr,
      status: "created",
      shipping_address_id: shippingId,
      billing_address_id: billingId,
      shipping_snapshot: shippingSnapshot,
      billing_snapshot: billingSnapshot,
    })
    .select("id")
    .single();
  if (orderErr || !order) {
    log.error("order insert failed, rolling back reservation", orderErr, { artworkId });
    await admin
      .from("artworks")
      .update({ status: "available", reserved_by: null, reserved_until: null })
      .eq("id", art.id);
    throw new Error(orderErr?.message ?? "Could not create order.");
  }
  log.info("order created", { orderId: order.id });

  // Create the Razorpay payment link (UPI). Amount is in paise.
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let paymentLinkUrl: string;
  log.step("creating razorpay payment link", { orderId: order.id, amountPaise: art.price_inr * 100 });
  try {
    const rzp = razorpay();
    // The razorpay typings are stricter than the API; cast the payload.
    const link = await rzp.paymentLink.create({
      amount: art.price_inr * 100,
      currency: "INR",
      accept_partial: false,
      description: `Artwork: ${art.title}`,
      reference_id: order.id, // our order id, echoed back in the webhook
      notify: { sms: false, email: false },
      reminder_enable: false,
      callback_url: `${site}/checkout/return?order=${order.id}`,
      callback_method: "get",
      notes: { order_id: order.id, artwork_id: art.id },
    } as any);

    paymentLinkUrl = link.short_url as string;

    await admin
      .from("orders")
      .update({ razorpay_payment_link_id: link.id as string })
      .eq("id", order.id);
    log.info("payment link created", { orderId: order.id, linkId: link.id, url: paymentLinkUrl });
  } catch (e: any) {
    log.error("payment link creation failed, rolling back", e, { orderId: order.id });
    // Roll everything back on gateway failure.
    await admin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    await admin
      .from("artworks")
      .update({ status: "available", reserved_by: null, reserved_until: null })
      .eq("id", art.id);
    throw new Error(
      "Could not start payment. " + (e?.error?.description ?? e?.message ?? "")
    );
  }

  log.step("redirecting to payment link", { orderId: order.id });
  redirect(paymentLinkUrl);
}
