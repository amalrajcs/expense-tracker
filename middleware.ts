import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const client = createSupabaseMiddlewareClient(req);

  const {
    data: { user },
  } = await client.supabase.auth.getUser();

  const res = client.res;

  const isAuthRoute =
    req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/signup");
  const isProtected = req.nextUrl.pathname.startsWith("/dashboard");

  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    
    // Crucial: Copy cookies from 'res' to the redirect response
    const redirectRes = NextResponse.redirect(url);
    res.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  }

  if (isAuthRoute && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    
    // Crucial: Copy cookies from 'res' to the redirect response
    const redirectRes = NextResponse.redirect(url);
    res.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectRes;
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup"],
};

