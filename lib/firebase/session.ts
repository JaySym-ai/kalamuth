import "server-only";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/server";
import { getAuthUser } from "@/lib/auth/server";

export const SESSION_COOKIE_NAME = "__session"; // works with Firebase Hosting; fine elsewhere too

// Legacy function - use getAuthUser from @/lib/auth/server instead
export async function getSessionUser() {
  return await getAuthUser();
}

// Exchange a Firebase ID token for a session cookie (legacy - use next-firebase-auth-edge instead)
export async function createSessionCookie(idToken: string, expiresInMs = 14 * 24 * 60 * 60 * 1000) {
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
  const jar = await cookies();
  const expires = new Date(Date.now() + expiresInMs);
  jar.set(SESSION_COOKIE_NAME, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

