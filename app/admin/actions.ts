"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth";
import { logger } from "@/lib/log";

const log = logger("admin");

async function assertAdmin() {
  if (!(await isAdmin())) {
    log.warn("blocked non-admin action");
    throw new Error("Not authorised.");
  }
}

// Receives an already-compressed image (from the browser) plus metadata,
// uploads to Storage, and inserts the artwork row.
export async function createArtwork(formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();

  const title = (formData.get("title") as string)?.trim();
  const price = parseInt(formData.get("price_inr") as string, 10);
  const medium = ((formData.get("medium") as string) || "").trim() || null;
  const dimensions = ((formData.get("dimensions") as string) || "").trim() || null;
  const description = ((formData.get("description") as string) || "").trim() || null;
  const file = formData.get("image") as File | null;

  log.step("createArtwork invoked", { title, price, hasFile: !!(file && file.size > 0) });

  if (!title || !price || price <= 0) {
    log.warn("validation failed", { title, price });
    throw new Error("Title and a positive price are required.");
  }

  let image_path: string | null = null;
  if (file && file.size > 0) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const key = `${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    log.step("uploading image to storage", { key, bytes: buffer.length });
    const { error: upErr } = await admin.storage
      .from("artworks")
      .upload(key, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (upErr) {
      // Most common cause: the 'artworks' bucket doesn't exist (migration not run).
      log.error("image upload failed", upErr, { key });
      throw new Error(`Image upload failed: ${upErr.message}`);
    }
    image_path = key;
    log.info("image uploaded", { key });
  }

  log.step("inserting artwork row", { title });
  const { error } = await admin.from("artworks").insert({
    title,
    price_inr: price,
    medium,
    dimensions,
    description,
    image_path,
    status: "available",
  });
  if (error) {
    // Most common cause: the 'artworks' table doesn't exist (migration not run).
    log.error("artwork insert failed", error, { title });
    throw new Error(`Artwork insert failed: ${error.message}`);
  }

  log.info("artwork published", { title });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function markShipped(orderId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  log.step("marking order shipped", { orderId });
  const { error } = await admin
    .from("orders")
    .update({ status: "shipped", shipped_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) {
    log.error("mark shipped failed", error, { orderId });
    throw new Error(`Mark shipped failed: ${error.message}`);
  }
  log.info("order marked shipped", { orderId });
  revalidatePath("/admin/orders");
}
