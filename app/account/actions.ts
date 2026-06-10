"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/log";

const log = logger("account");

export async function addAddress(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const get = (k: string) => (formData.get(k) as string)?.trim() || null;

  log.step("adding address", { userId: user.id, kind: get("kind") });
  const { error } = await supabase.from("addresses").insert({
    user_id: user.id,
    kind: get("kind") ?? "shipping",
    line1: get("line1"),
    line2: get("line2"),
    city: get("city"),
    state: get("state"),
    postal_code: get("postal_code"),
    country: get("country") ?? "IN",
  });
  if (error) {
    log.error("address insert failed", error, { userId: user.id });
    throw new Error(`Could not save address: ${error.message}`);
  }

  log.info("address added", { userId: user.id });
  revalidatePath("/account");
}

export async function updateAddress(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const id = formData.get("id") as string;
  const get = (k: string) => (formData.get(k) as string)?.trim() || null;
  if (!id) throw new Error("Missing address id.");

  log.step("updating address", { userId: user.id, addressId: id });
  // RLS ensures a user can only update their own row; we also scope by user_id.
  const { error } = await supabase
    .from("addresses")
    .update({
      kind: get("kind") ?? "shipping",
      line1: get("line1"),
      line2: get("line2"),
      city: get("city"),
      state: get("state"),
      postal_code: get("postal_code"),
      country: get("country") ?? "IN",
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    log.error("address update failed", error, { addressId: id });
    throw new Error(`Could not update address: ${error.message}`);
  }

  log.info("address updated", { addressId: id });
  revalidatePath("/account");
}

export async function deleteAddress(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing address id.");

  // If this address is referenced by any order, soft-delete to keep history's
  // foreign key valid. Otherwise hard-delete.
  log.step("deleting address", { userId: user.id, addressId: id });
  const { count, error: refErr } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .or(`shipping_address_id.eq.${id},billing_address_id.eq.${id}`);
  if (refErr) {
    log.error("could not check address references", refErr, { addressId: id });
    throw new Error(`Could not delete address: ${refErr.message}`);
  }

  if ((count ?? 0) > 0) {
    log.info("address referenced by orders, soft-deleting", { addressId: id, refs: count });
    const { error } = await supabase
      .from("addresses")
      .update({ deleted_at: new Date().toISOString(), is_default: false })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      log.error("soft-delete failed", error, { addressId: id });
      throw new Error(`Could not delete address: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      log.error("hard-delete failed", error, { addressId: id });
      throw new Error(`Could not delete address: ${error.message}`);
    }
    log.info("address hard-deleted", { addressId: id });
  }

  revalidatePath("/account");
}

export async function setDefaultAddress(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing address id.");

  log.step("setting default address", { userId: user.id, addressId: id });
  const { error } = await supabase.rpc("set_default_address", {
    p_address: id,
    p_user: user.id,
  });
  if (error) {
    log.error("set default failed", error, { addressId: id });
    throw new Error(`Could not set default: ${error.message}`);
  }

  log.info("default address set", { addressId: id });
  revalidatePath("/account");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}
