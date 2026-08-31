import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminHost } from "@/utils/seo";

// Host, not URL — compared directly against the incoming request's `Host`
// header (which includes the port in dev, e.g. "admin.localhost:3001").
// Unset by default so nothing changes until this is configured.
const ADMIN_HOST = getAdminHost();

export function proxy(request: NextRequest) {
  if (!ADMIN_HOST) return NextResponse.next();

  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  if (host === ADMIN_HOST) {
    // The admin subdomain has its own login page (AdminLoginScreen, at the
    // internal "/admin/login" route) — it is NOT an alias for the main
    // host's /login. This falls through to the general rewrite below like
    // any other admin path.
    //
    // The admin subdomain only ever serves the admin app, and the "/admin"
    // prefix must never be visible in its URLs (admin.host/users, not
    // admin.host/admin/users) — every admin Link/redirect already targets
    // the stripped form (see src/utils/seo.ts's adminPath()), so a request
    // that already starts with "/admin" only happens for a stale bookmark
    // or a direct typed URL; pass it through unchanged rather than double
    // it into "/admin/admin/...". Anything else (a bare "/", or a clean
    // "/users") gets mapped into the internal admin route tree.
    if (pathname.startsWith("/admin")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Main app host: admin routes now live on the admin subdomain instead of
  // here — send old bookmarks/links there rather than serving them locally,
  // stripping the "/admin" prefix since it's not part of the admin host's
  // visible URL scheme (stockharvesting.com/admin/users ->
  // admin.stockharvesting.com/users, not .../admin/users).
  if (pathname.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.host = ADMIN_HOST;
    const stripped = pathname.slice("/admin".length);
    url.pathname = stripped === "" ? "/" : stripped;
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
