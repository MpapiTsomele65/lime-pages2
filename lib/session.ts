import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionPayload } from "./definitions";

const COOKIE_NAME = "lehumo_session";
const EXPIRY_DAYS = 7;

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_DAYS}d`)
    .sign(getSecretKey());
}

export async function decrypt(session: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(session, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(
  memberId: string,
  email: string,
  memberNumber: number,
  fullName: string,
) {
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const session = await encrypt({
    memberId,
    email,
    memberNumber,
    fullName,
    exp: Math.floor(expiresAt.getTime() / 1000),
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Cookie path must be a prefix of EVERY URL that needs the
    // session. The portal pages live at /lehumo/portal/** but their
    // API endpoints (KYC upload, paystack init, admin actions, etc)
    // live at /api/lehumo/portal/** — a sibling tree. Browser cookie
    // matching is path-prefix based, so a cookie with path
    // /lehumo/portal is silently NOT sent to /api/...; that broke
    // the KYC upload routes' getSession()/getAdminSession() checks
    // with a 403 every time. Use "/" so the JWT travels with both
    // tree branches.
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  // Match the path used by createSession so the delete actually
  // clears the cookie. Mismatched paths leave a stale cookie behind
  // even after the user signs out.
  cookieStore.delete({ name: COOKIE_NAME, path: "/" });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME)?.value;
  if (!session) return null;
  return decrypt(session);
}
