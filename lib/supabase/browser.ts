import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log("Supabase Client Init:", { url, hasKey: !!anonKey });
  // Avoid crashing builds/prerender when env isn't configured yet.
  return createBrowserClient(url ?? "http://localhost:54321", anonKey ?? "anon");
}

