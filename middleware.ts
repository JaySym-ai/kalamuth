import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getTokens } from "next-firebase-auth-edge";
import { routing } from "./i18n/routing";
import { authConfig, PUBLIC_PATHS } from "./lib/auth/config";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this is an API route
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute) {
    // For API routes, handle authentication but don't redirect
    // Only process API routes that need authentication
    const needsAuth = pathname.startsWith('/api/user') ||
                     pathname.startsWith('/api/ludus') ||
                     (pathname.startsWith('/api/auth') && !pathname.includes('/session'));

    if (needsAuth) {
      try {
        const tokens = await getTokens(request.cookies, authConfig);
        if (!tokens) {
          return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }
        // Continue to the API route with verified tokens
        return NextResponse.next();
      } catch (error) {
        console.error("API authentication error:", error);
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    // For other API routes (like /api/auth/session), just continue
    return NextResponse.next();
  }

  // For non-API routes, run intl middleware first
  const intlResponse = intlMiddleware(request);

  // Get the locale for checking
  const localeMatch = pathname.match(/^\/(en|fr)(\/.*)?$/);
  const pathWithoutLocale = localeMatch ? (localeMatch[2] || "/") : pathname;
  const locale = localeMatch ? localeMatch[1] : "en";

  // Check if this is a public page
  const isPublicPage = PUBLIC_PATHS.some(path => pathWithoutLocale.startsWith(path)) || pathWithoutLocale === "/";

  if (isPublicPage) {
    // For public pages, just return the intl response
    return intlResponse;
  }

  // For protected pages, check authentication
  try {
    const tokens = await getTokens(request.cookies, authConfig);

    if (!tokens) {
      // No valid tokens, redirect to auth page
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/auth`;
      url.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // User is authenticated, return the intl response
    return intlResponse;
  } catch (error) {
    console.error("Authentication error:", error);

    // On error, redirect to auth page
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/auth`;
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // API routes that need authentication
    "/api/user/:path*",
    "/api/auth/:path*",
    "/api/ludus/:path*",
    // Main application routes
    "/",
    "/(en|fr)/:path*",
    // Exclude static files and Next.js internals
    "/((?!_next|favicon.ico|.*\\.).*)",
  ],
};

