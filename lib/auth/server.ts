import "server-only";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "./config";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  customClaims: Record<string, unknown>;
}

/**
 * Get the current authenticated user from server-side context
 * Returns null if no valid authentication is found
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const tokens = await getTokens(cookieStore, authConfig);
    
    if (!tokens) {
      return null;
    }

    const { decodedToken } = tokens;
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      displayName: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
      customClaims: (decodedToken.custom_claims as Record<string, unknown>) || {},
    };
  } catch (error) {
    console.error("Failed to get authenticated user:", error);
    return null;
  }
}

/**
 * Get the decoded ID token from server-side context
 * Returns null if no valid authentication is found
 */
export async function getDecodedToken(): Promise<DecodedIdToken | null> {
  try {
    const cookieStore = await cookies();
    const tokens = await getTokens(cookieStore, authConfig);
    
    return tokens?.decodedToken || null;
  } catch (error) {
    console.error("Failed to get decoded token:", error);
    return null;
  }
}

/**
 * Check if the current request is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

/**
 * Require authentication - throws an error if not authenticated
 * Use this in server components or API routes that require authentication
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
