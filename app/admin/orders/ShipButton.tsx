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
      className="btn-primary mt-3 px-4 py-1.5 text-xs"
    >
      {done ? "Shipped" : pending ? "Saving…" : "Mark as shipped"}
    </button>
  );
}
