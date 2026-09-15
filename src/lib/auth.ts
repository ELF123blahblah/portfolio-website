import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

/**
 * Every mutating Server Action must call this first. Middleware/proxy only
 * protects page navigation, not direct Server Action invocation.
 */
export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token || !(await verifySessionToken(token))) {
    throw new Error("Unauthorized");
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
