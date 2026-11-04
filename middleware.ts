import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth.edge";
import { isAuthPage, signedInRedirect } from "@/lib/auth/signed-in-redirect";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = (req.auth?.user as any)?.role;

  // Signing in or signing up again while already signed in is how one
  // customer becomes two accounts: the form is reachable, it works, and
  // nothing on screen says the browser already has a session. The orders,
  // points and addresses then split across two accounts and the staff can
  // only find one of them. So these pages are closed while a session exists,
  // and the destination carries a notice so the person is told why — rather
  // than silently landing somewhere they did not ask for.
  if (isAuthPage(pathname)) {
    if (req.auth) {
      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      return NextResponse.redirect(new URL(signedInRedirect(callbackUrl), req.url));
    }
    return NextResponse.next();
  }

  // Studio is open in dev, but you can restrict in prod
  if (pathname.startsWith("/admin")) {
    if (!req.auth) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (
    pathname.startsWith("/account") ||
    pathname.startsWith("/api/account") ||
    pathname.startsWith("/api/membership/subscribe") ||
    (pathname.startsWith("/api/orders") && !pathname.endsWith("/packing-slip"))
  ) {
    if (!req.auth) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/login",
    "/register",
    "/signup",
    "/admin/:path*",
    "/account/:path*",
    "/api/account/:path*",
    "/api/membership/:path*",
    "/api/orders/:path*",
  ],
};
