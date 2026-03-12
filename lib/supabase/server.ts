import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  // Avoid crashing builds/prerender when env isn't configured yet.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon";

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookieOptions: {
      name: "sb-auth-token",
      maxAge: 60 * 60 * 24 * 7,
      domain: "",
      path: "/",
      sameSite: "lax",
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Fallback if set() is called during a regular page render
        }
      },
    },
  });
}

