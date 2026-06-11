"use client";

import { addAddress } from "./actions";

export default function AddressForm() {
  return (
    <form
      action={addAddress}
      className="card grid grid-cols-1 gap-3 p-5 sm:grid-cols-2"
    >
      <select name="kind" className="input" defaultValue="shipping">
        <option value="shipping">Shipping</option>
        <option value="billing">Billing</option>
      </select>
      <div className="hidden sm:block" />
      <input name="line1" placeholder="Address line 1" className="input" required />
      <input name="line2" placeholder="Address line 2 (optional)" className="input" />
      <input name="city" placeholder="City" className="input" required />
      <input name="state" placeholder="State" className="input" />
      <input name="postal_code" placeholder="PIN code" className="input" required />
      <input name="country" placeholder="Country" defaultValue="IN" className="input" />
      <div className="sm:col-span-2">
        <button className="btn-primary px-5 py-2.5">Save address</button>
      </div>
    </form>
  );
}
