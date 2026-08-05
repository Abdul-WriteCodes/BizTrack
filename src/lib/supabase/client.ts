import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser client — uses the ANON key only. Every query made with this
 * client is subject to Postgres RLS policies (see supabase/migrations).
 * Never import the service-role key into anything that ships to the client.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
