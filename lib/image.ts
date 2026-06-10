import { createClient } from "@/lib/supabase/server";

// Returns a public URL for an image stored in the 'artworks' bucket.
export function publicImageUrl(path: string | null): string | null {
  if (!path) return null;
  const supabase = createClient();
  const { data } = supabase.storage.from("artworks").getPublicUrl(path);
  return data.publicUrl;
}
