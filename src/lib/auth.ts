import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "src_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// ─── Sign a JWT and set it as an HTTP-only cookie ────────────────
export async function signInAdmin(): Promise<void> {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

// ─── Verify the session cookie ───────────────────────────────────
export async function verifyAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

// ─── Guard for server actions / upload routes: admin only ────────
// The proxy only protects /x9 page requests, not actions invoked directly.
export async function requireAdmin(): Promise<void> {
  if (!(await verifyAdminSession())) throw new Error("Unauthorized");
}

// ─── Clear session (logout) ──────────────────────────────────────
export async function signOutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// ─── Validate credentials against env vars ───────────────────────
export function validateAdminCredentials(email: string, password: string): boolean {
  return (
    email === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  );
}
