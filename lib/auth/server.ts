import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { debug_error } from "@/utils/debug";
import type { SupabaseClient } from "@supabase/supabase-js";

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

/**
 * Require authentication for a server page
 * Returns the authenticated user and supabase client, or redirects to auth page
 *
 * @param locale - The current locale for redirect
 * @returns Object containing authenticated user and supabase client
 *
 * @example
 * ```typescript
 * export default async function MyPage({ params }: { params: Promise<{ locale: string }> }) {
 *   const { locale } = await params;
 *   const { user, supabase } = await requireAuthPage(locale);
 *   // ... rest of page logic
 * }
 * ```
 */
export async function requireAuthPage(locale: string): Promise<{
  user: { id: string; email?: string };
  supabase: SupabaseClient;
}> {
  const supabase = createClient(await cookies());
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    redirect(`/${locale}/auth`);
  }

  return { user, supabase };
}

/**
 * Require authentication for an API route
 * Returns the authenticated user and supabase client, or throws an error
 *
 * @returns Object containing authenticated user and supabase client
 * @throws Error with "unauthorized" message if not authenticated
 *
 * @example
 * ```typescript
 * export async function POST(req: Request) {
 *   const { user, supabase } = await requireAuthAPI();
 *   // ... rest of API logic
 * }
 * ```
 */
export async function requireAuthAPI(): Promise<{
  user: { id: string; email?: string };
  supabase: SupabaseClient;
}> {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    throw new Error("unauthorized");
  }

  return { user, supabase };
}
