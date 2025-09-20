import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "./i18n/routing";
import { PUBLIC_PATHS } from "./lib/auth/config";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // API routes: authenticate and return 401 on failure
  if (pathname.startsWith("/api/")) {
    const needsAuth = pathname.startsWith("/api/user") || pathname.startsWith("/api/ludus");
    if (!needsAuth) return NextResponse.next();

    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return response;
  }

  // Non-API routes: run i18n middleware first
  const response = intlMiddleware(request);

  // Extract locale and path without locale
  const localeMatch = pathname.match(/^\/(en|fr)(\/.*)?$/);
  const pathWithoutLocale = localeMatch ? localeMatch[2] || "/" : pathname;
  const locale = (localeMatch ? localeMatch[1] : "en") as "en" | "fr";

  // Public pages do not require auth
  const isPublicPage = PUBLIC_PATHS.some((p) => pathWithoutLocale.startsWith(p)) || pathWithoutLocale === "/";
  if (isPublicPage) return response;

  // Protected page: validate Supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth`;
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/api/user/:path*",
    "/api/ludus/:path*",
    "/",
    "/(en|fr)/:path*",
    "/((?!_next|favicon.ico|.*\\.).*)",
  ],
};

