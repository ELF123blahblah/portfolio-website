import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (same behavior, new name
// to reflect that it runs on a network boundary in front of the app). See
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
//
// This only protects page navigation. Every mutating Server Action must
// independently call requireAuth() — see src/lib/auth.ts.
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isValid = token ? await verifySessionToken(token) : false;

  if (!isValid) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
