"use client";

import { useState } from "react";
import { Address } from "@/lib/types";
import {
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./actions";

export default function AddressCard({ address }: { address: Address }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await updateAddress(fd);
          setEditing(false);
        }}
        className="card grid grid-cols-1 gap-3 border-accent/30 p-5 sm:grid-cols-2"
      >
        <input type="hidden" name="id" value={address.id} />
        <select name="kind" className="input" defaultValue={address.kind}>
          <option value="shipping">Shipping</option>
          <option value="billing">Billing</option>
        </select>
        <div className="hidden sm:block" />
        <input name="line1" defaultValue={address.line1} placeholder="Address line 1" className="input" required />
        <input name="line2" defaultValue={address.line2 ?? ""} placeholder="Address line 2 (optional)" className="input" />
        <input name="city" defaultValue={address.city} placeholder="City" className="input" required />
        <input name="state" defaultValue={address.state ?? ""} placeholder="State" className="input" />
        <input name="postal_code" defaultValue={address.postal_code} placeholder="PIN code" className="input" required />
        <input name="country" defaultValue={address.country} placeholder="Country" className="input" />
        <div className="flex gap-3 sm:col-span-2">
          <button className="btn-primary px-5 py-2.5">Save changes</button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="card flex items-start justify-between gap-4 p-4 text-sm transition-colors duration-300 hover:border-accent/30">
      <div className="text-muted">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full border border-line bg-raise px-2 py-0.5 text-[0.65rem] uppercase tracking-widest2 text-faint">
            {address.kind}
          </span>
          {address.is_default && (
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-widest2 text-accent">
              Default
            </span>
          )}
        </div>
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}, {address.city}
        {address.state ? `, ${address.state}` : ""} {address.postal_code},{" "}
        {address.country}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <button
          onClick={() => setEditing(true)}
          className="link-quiet text-xs"
        >
          Edit
        </button>
        {!address.is_default && (
          <form action={setDefaultAddress}>
            <input type="hidden" name="id" value={address.id} />
            <button className="link-quiet text-xs">Set default</button>
          </form>
        )}
        <form action={deleteAddress}>
          <input type="hidden" name="id" value={address.id} />
          <button className="text-xs text-red-400 underline decoration-red-900 underline-offset-4 transition-colors hover:text-red-300">
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
