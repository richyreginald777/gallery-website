import { createClient } from "@supabase/supabase-js";

// SERVICE-ROLE client. Bypasses Row Level Security. SERVER ONLY.
// Used by the webhook and admin server actions to write artworks/orders.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
