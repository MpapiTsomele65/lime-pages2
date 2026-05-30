import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("lehumo_session")?.value;
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/lehumo/portal/login";
  // Anything nested under /login (forgot-password, reset, future
  // captcha pages …) is public. We special-case the bare /login above
  // so the "already logged in → bounce to dashboard" rule applies
  // ONLY to the entry point, not to mid-reset traffic — a member who
  // clicks a magic link while still logged in should reach the reset
  // form, not get punted back to the dashboard.
  const isLoginSubPage = pathname.startsWith("/lehumo/portal/login/");
  const isForgotPage = pathname === "/lehumo/portal/forgot";
  const isPublicPage = isLoginPage || isLoginSubPage || isForgotPage;

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
      // Match createSession's path="/" so the delete actually clears
      // the cookie instead of leaving a stale one at the old path.
      response.cookies.delete({ name: "lehumo_session", path: "/" });
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
