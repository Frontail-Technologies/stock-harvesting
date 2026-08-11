import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminHost, getSiteUrl } from "@/utils/seo";

// Host, not URL — compared directly against the incoming request's `Host`
// header (which includes the port in dev, e.g. "admin.localhost:3001").
// Unset by default so nothing changes until this is configured.
const ADMIN_HOST = getAdminHost();

export function proxy(request: NextRequest) {
  if (!ADMIN_HOST) return NextResponse.next();

  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (host === ADMIN_HOST) {
    // There is exactly one login page, on the main host — the admin
    // subdomain never renders its own copy. In normal use the app already
    // sends people to the right host directly (see AuthGuard/LoginScreen);
    // this is the server-side fallback for a direct visit/bookmark.
    if (pathname === "/login") {
      const url = request.nextUrl.clone();
      url.host = getSiteUrl().host;
      return NextResponse.redirect(url, 308);
    }
    // The admin subdomain only ever serves the admin app. Real admin links
    // already carry the "/admin" prefix and pass through untouched; any
    // other path (a bare "/", or someone typing a main-app route here) gets
    // mapped into the admin tree instead of leaking the main app's pages.
    if (pathname.startsWith("/admin")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Main app host: admin routes now live on the admin subdomain instead of
  // here — send old bookmarks/links there rather than serving them locally.
  if (pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.host = ADMIN_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and any request for a file (favicon.ico, images,
  // site.webmanifest, sitemap.xml, robots.txt, ...) — only route-like paths
  // need the host check above.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
