"use client";

import { addAddress } from "./actions";

const input =
  "w-full rounded border border-neutral-300 px-3 py-2 text-sm";

export default function AddressForm() {
  return (
    <form
      action={addAddress}
      className="grid grid-cols-1 gap-3 rounded border border-neutral-200 bg-white p-4 sm:grid-cols-2"
    >
      <select name="kind" className={input} defaultValue="shipping">
        <option value="shipping">Shipping</option>
        <option value="billing">Billing</option>
      </select>
      <div className="hidden sm:block" />
      <input name="line1" placeholder="Address line 1" className={input} required />
      <input name="line2" placeholder="Address line 2 (optional)" className={input} />
      <input name="city" placeholder="City" className={input} required />
      <input name="state" placeholder="State" className={input} />
      <input name="postal_code" placeholder="PIN code" className={input} required />
      <input name="country" placeholder="Country" defaultValue="IN" className={input} />
      <div className="sm:col-span-2">
        <button className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">
          Save address
        </button>
      </div>
    </form>
  );
}
