import { NextResponse } from "next/server";
import { refreshCookiesWithIdToken } from "next-firebase-auth-edge/lib/next/cookies";
import { removeCookies } from "next-firebase-auth-edge/lib/next/cookies";
import { headers, cookies } from "next/headers";
import { authConfig } from "@/lib/auth/config";

export const runtime = "nodejs"; // Admin SDK requires Node.js runtime, not Edge

// POST /api/auth/session  { idToken: string }
export async function POST(req: Request) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  try {
    // Use next-firebase-auth-edge to refresh cookies with the ID token
    await refreshCookiesWithIdToken(
      idToken,
      await headers(),
      await cookies(),
      authConfig
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth/session] Failed to create session cookie:", err);
    }
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}

// DELETE /api/auth/session  — sign out
export async function DELETE(req: Request) {
  try {
    const response = NextResponse.json({ ok: true });

    // Remove authentication cookies
    removeCookies(req.headers, response, {
      cookieName: authConfig.cookieName,
      cookieSerializeOptions: authConfig.cookieSerializeOptions,
    });

    return response;
  } catch (err) {
    console.error("[auth/session] Failed to clear session:", err);
    return NextResponse.json({ ok: true }); // Still return success to avoid client errors
  }
}

