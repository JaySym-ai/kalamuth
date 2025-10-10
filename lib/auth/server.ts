import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { debug_log, debug_error, debug_warn, debug_info } from "@/utils/debug";

export interface AuthUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  customClaims: Record<string, unknown>;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const jar = await cookies();
    const supabase = createClient(jar);
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const u = data.user;
    return {
      uid: u.id,
      email: u.email ?? null,
      emailVerified: Boolean(u.email_confirmed_at),
      displayName: (u.user_metadata?.name as string) ?? null,
      photoURL: (u.user_metadata?.avatar_url as string) ?? null,
      customClaims: {},
    };
  } catch (error) {
    debug_error("Failed to get authenticated user:", error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}
