import "server-only";

import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase/server";
import { getAuthUser } from "@/lib/auth/server";

// Resolve the authenticated user from either:
// - Web: HTTP-only session cookie (preferred for SSR) using next-firebase-auth-edge
// - Native (Capacitor): Authorization: Bearer <ID_TOKEN>
export async function getRequestUser(req?: Request) {
  // Try next-firebase-auth-edge cookie-based session first
  const authUser = await getAuthUser();
  if (authUser) return authUser;

  // For API routes, we'll rely on the Authorization header fallback below
  // since getApiRequestTokens has different type requirements

  // Fallback: Authorization header with Firebase ID token (for native/Capacitor)
  let authHeader: string | null = null;
  if (req) authHeader = req.headers.get("authorization");
  else authHeader = (await headers()).get("authorization");

  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(m[1]);
    return {
      uid: decoded.uid,
      email: decoded.email || null,
      emailVerified: decoded.email_verified || false,
      displayName: decoded.name || null,
      photoURL: decoded.picture || null,
      customClaims: (decoded.custom_claims as Record<string, unknown>) || {},
    };
  } catch {
    return null;
  }
}

