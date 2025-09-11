import "server-only";

import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase/server";
import { getSessionUser } from "@/lib/firebase/session";

// Resolve the authenticated user from either:
// - Web: HTTP-only session cookie (preferred for SSR)
// - Native (Capacitor): Authorization: Bearer <ID_TOKEN>
export async function getRequestUser(req?: Request) {
  // Try cookie-based session first
  const cookieUser = await getSessionUser();
  if (cookieUser) return cookieUser;

  // Fallback: Authorization header with Firebase ID token
  let authHeader: string | null = null;
  if (req) authHeader = req.headers.get("authorization");
  else authHeader = (await headers()).get("authorization");

  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(m[1]);
    return decoded;
  } catch {
    return null;
  }
}

