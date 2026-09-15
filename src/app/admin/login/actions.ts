"use server";

import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/session";
import { isRateLimited, recordFailure, recordSuccess } from "@/lib/rate-limit";

const GENERIC_ERROR = "Incorrect password or too many attempts. Try again later.";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getClientKey(): Promise<string> {
  const headerList = await headers();

  // x-real-ip is set by Vercel's edge proxy to the actual connecting
  // client and is not client-controllable. x-forwarded-for's *first*
  // entry, by contrast, is whatever the client sends and can be spoofed
  // to a fresh value on every request to dodge the rate limit — only its
  // *last* entry (the hop closest to our own infra) is trustworthy, so
  // that's the fallback if x-real-ip is ever absent (e.g. local dev).
  const realIp = headerList.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = headerList.get("x-forwarded-for");
  const hops = forwardedFor?.split(",").map((h) => h.trim()).filter(Boolean);
  return hops?.[hops.length - 1] ?? "unknown";
}

export async function login(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const password = formData.get("password");
  const clientKey = await getClientKey();

  if (isRateLimited(clientKey)) {
    await sleep(1000);
    return { error: GENERIC_ERROR };
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (typeof password !== "string" || password.length === 0 || !passwordHash) {
    await sleep(1000);
    recordFailure(clientKey);
    return { error: GENERIC_ERROR };
  }

  const start = Date.now();
  const isValid = await bcrypt.compare(password, passwordHash);
  const elapsed = Date.now() - start;
  if (elapsed < 1000) {
    await sleep(1000 - elapsed);
  }

  if (!isValid) {
    recordFailure(clientKey);
    return { error: GENERIC_ERROR };
  }

  recordSuccess(clientKey);

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/admin");
}
