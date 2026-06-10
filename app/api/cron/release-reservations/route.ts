import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/log";

const log = logger("cron:release");

// Releases artworks whose reservation hold lapsed without payment.
// Wired to Vercel Cron (see vercel.json). Protected by CRON_SECRET if set.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  log.step("running reservation sweep");
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("release_expired_reservations");
  if (error) {
    log.error("sweep failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  log.info("sweep complete", { released: data ?? 0 });
  return NextResponse.json({ released: data ?? 0 });
}
