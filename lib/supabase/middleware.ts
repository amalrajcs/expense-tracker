import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function createSupabaseMiddlewareClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon";

  // Create an initial response
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: {
      name: "sb-auth-token",
      maxAge: 60 * 60 * 24 * 7,
      domain: "",
      path: "/",
      sameSite: "lax",
    },
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update the request cookies first
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        
        // Re-generate the response with updated request headers
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });

        // Update the response cookies
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  // Return a proxy-like object that always provides the LATEST 'res'
  // However, for simplicity and since we control the call to getUser(), 
  // we can just return an object and understand that getUser() will update the local 'res' variable above.
  // We need to return the 'res' by a way that the caller gets the latest version.
  
  return { 
    supabase, 
    // This is the tricky part. If setAll is called, 'res' above is updated.
    // The caller of createSupabaseMiddlewareClient gets the result.
    // If they call getUser() AFTER getting the result, 'res' is updated internally.
    // We should return a getter for 'res'.
    get res() { return res; }
  };
}

