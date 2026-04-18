import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("lehumo_session")?.value;
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/lehumo/portal/login";
  const isForgotPage = pathname === "/lehumo/portal/forgot";
  const isPublicPage = isLoginPage || isForgotPage;

  // No session → redirect to login (unless on a public page)
  if (!session && !isPublicPage) {
    return NextResponse.redirect(new URL("/lehumo/portal/login", request.url));
  }

  // Has session → verify it
  if (session) {
    const payload = await decrypt(session);

    // Invalid/expired session → redirect to login
    if (!payload && !isPublicPage) {
      const response = NextResponse.redirect(
        new URL("/lehumo/portal/login", request.url),
      );
      response.cookies.delete("lehumo_session");
      return response;
    }

    // Valid session + on login page → redirect to portal
    if (payload && isLoginPage) {
      return NextResponse.redirect(
        new URL("/lehumo/portal", request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/lehumo/portal/:path*"],
};
