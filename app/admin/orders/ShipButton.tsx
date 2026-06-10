"use client";

import { useState, useTransition } from "react";
import { markShipped } from "../actions";

export default function ShipButton({ orderId }: { orderId: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  return (
    <button
      disabled={pending || done}
      onClick={() => start(async () => {
        await markShipped(orderId);
        setDone(true);
      })}
      className="mt-3 rounded bg-neutral-900 px-3 py-1.5 text-xs text-white disabled:opacity-50"
    >
      {done ? "Shipped" : pending ? "Saving…" : "Mark as shipped"}
    </button>
  );
}
