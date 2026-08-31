import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminHost } from "@/utils/seo";
import { RESOLVED_PATHNAME_HEADER, normalizeHost, resolveRequestHost } from "@/utils/hostname";

const ADMIN_HOST = getAdminHost();
const NORMALIZED_ADMIN_HOST = ADMIN_HOST ? normalizeHost(ADMIN_HOST) : null;

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

    if (pathname.startsWith("/admin")) {
      return NextResponse.next(withResolvedPathname(request, pathname));
    }
    const url = request.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url, withResolvedPathname(request, url.pathname));
  }

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

  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
