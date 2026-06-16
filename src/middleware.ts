import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  console.log("\n🔐 [MIDDLEWARE] Processing:", request.nextUrl.pathname);

  // NextAuth v5 uses auth.callback cookie with session-token
  // Check for: authjs.session-token or __Secure-authjs.session-token
  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value; // Fallback for older versions

  console.log("🔐 [MIDDLEWARE] Token found:", !!token);

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      console.log("🔐 [MIDDLEWARE] No token found, redirecting to /auth/login");
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    console.log("✅ [MIDDLEWARE] Token valid, allowing dashboard access");
  }

  // Redirect authenticated users from auth pages
  if (request.nextUrl.pathname.startsWith("/auth")) {
    if (token) {
      console.log("✅ [MIDDLEWARE] User authenticated, redirecting from /auth to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    console.log("🔐 [MIDDLEWARE] No token, allowing auth page access");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
