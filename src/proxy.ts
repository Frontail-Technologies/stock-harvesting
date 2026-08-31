import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminHost } from "@/utils/seo";
import { RESOLVED_PATHNAME_HEADER, normalizeHost, resolveRequestHost } from "@/utils/hostname";

// Host, not URL — compared against the incoming request's resolved host
// (see resolveRequestHost: prefers X-Forwarded-Host, falls back to Host).
// Unset by default so nothing changes until this is configured.
const ADMIN_HOST = getAdminHost();
const NORMALIZED_ADMIN_HOST = ADMIN_HOST ? normalizeHost(ADMIN_HOST) : null;

// Stamps the pathname this request actually resolves to onto the outgoing
// request headers, so a Server Component (which has no direct pathname
// access) can verify hostname routing genuinely ran for this request,
// instead of trusting that it did — see src/app/layout.tsx's root-layout
// guard. Every return path below goes through this, so the header is never
// left stale from a previous request.
function withResolvedPathname(request: NextRequest, pathname: string, init?: Parameters<typeof NextResponse.next>[0]) {
  const headers = new Headers(request.headers);
  headers.set(RESOLVED_PATHNAME_HEADER, pathname);
  return { request: { ...init?.request, headers } };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!ADMIN_HOST || !NORMALIZED_ADMIN_HOST) {
    return NextResponse.next(withResolvedPathname(request, pathname));
  }

  const host = resolveRequestHost(request.headers);

  if (host === NORMALIZED_ADMIN_HOST) {
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
    if (pathname.startsWith("/admin")) {
      return NextResponse.next(withResolvedPathname(request, pathname));
    }
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, withResolvedPathname(request, url.pathname));
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

  return NextResponse.next(withResolvedPathname(request, pathname));
}

export const config = {
  // Skip Next internals and any request for a file (favicon.ico, images,
  // site.webmanifest, sitemap.xml, robots.txt, ...) — only route-like paths
  // need the host check above.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
