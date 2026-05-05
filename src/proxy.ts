import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;

  if (!token || !(await verifyAccessToken(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/access";
    // Preserve the original destination so we can redirect back after login
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except the access page, its API, and Next.js internals
  matcher: [
    "/((?!access|api/access|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
