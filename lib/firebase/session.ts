import "server-only";

import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/server";

export const SESSION_COOKIE_NAME = "__session"; // works with Firebase Hosting; fine elsewhere too

// Exchange a Firebase ID token for a session cookie
export async function createSessionCookie(idToken: string, expiresInMs = 14 * 24 * 60 * 60 * 1000) {
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn: expiresInMs });
  const jar = await cookies();
  const expires = new Date(Date.now() + expiresInMs);
  jar.set(SESSION_COOKIE_NAME, cookie, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionUser() {
  const jar = await cookies();
  const cookie = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    return decoded; // DecodedIdToken
  } catch {
    return null;
  }
}

