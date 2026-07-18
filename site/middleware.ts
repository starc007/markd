import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const slug = request.nextUrl.pathname.split("/")[2];
  if (slug) response.headers.set("Cache-Tag", `markd-slug-${slug}`);
  return response;
}

export const config = {
  matcher: "/s/:path*",
};
