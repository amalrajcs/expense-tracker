import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createBrowserClient("http://localhost:54321", "anon");
  }

  return createBrowserClient(url, anonKey, {
    cookieOptions: {
      name: "sb-auth-token", // Consistent cookie name
      maxAge: 60 * 60 * 24 * 7, // 1 week
      domain: "",
      path: "/",
      sameSite: "lax",
    },
  });
}

