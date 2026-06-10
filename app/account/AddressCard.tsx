"use client";

import { useState } from "react";
import { Address } from "@/lib/types";
import {
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./actions";

const input = "w-full rounded border border-neutral-300 px-3 py-2 text-sm";

export default function AddressCard({ address }: { address: Address }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await updateAddress(fd);
          setEditing(false);
        }}
        className="grid grid-cols-1 gap-3 rounded border border-neutral-300 bg-white p-4 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={address.id} />
        <select name="kind" className={input} defaultValue={address.kind}>
          <option value="shipping">Shipping</option>
          <option value="billing">Billing</option>
        </select>
        <div className="hidden sm:block" />
        <input name="line1" defaultValue={address.line1} placeholder="Address line 1" className={input} required />
        <input name="line2" defaultValue={address.line2 ?? ""} placeholder="Address line 2 (optional)" className={input} />
        <input name="city" defaultValue={address.city} placeholder="City" className={input} required />
        <input name="state" defaultValue={address.state ?? ""} placeholder="State" className={input} />
        <input name="postal_code" defaultValue={address.postal_code} placeholder="PIN code" className={input} required />
        <input name="country" defaultValue={address.country} placeholder="Country" className={input} />
        <div className="flex gap-2 sm:col-span-2">
          <button className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
            Save changes
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded border border-neutral-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded border border-neutral-200 bg-white p-3 text-sm">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs uppercase">
            {address.kind}
          </span>
          {address.is_default && (
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
              Default
            </span>
          )}
        </div>
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}, {address.city}
        {address.state ? `, ${address.state}` : ""} {address.postal_code},{" "}
        {address.country}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-neutral-600 underline"
        >
          Edit
        </button>
        {!address.is_default && (
          <form action={setDefaultAddress}>
            <input type="hidden" name="id" value={address.id} />
            <button className="text-xs text-neutral-600 underline">
              Set default
            </button>
          </form>
        )}
        <form action={deleteAddress}>
          <input type="hidden" name="id" value={address.id} />
          <button className="text-xs text-red-600 underline">Delete</button>
        </form>
      </div>
    </div>
  );
}
