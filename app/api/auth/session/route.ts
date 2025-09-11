import { NextResponse } from "next/server";
import { createSessionCookie, clearSessionCookie } from "@/lib/firebase/session";

export const runtime = "nodejs"; // Admin SDK requires Node.js runtime, not Edge

// POST /api/auth/session  { idToken: string }
export async function POST(req: Request) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }
  try {
    await createSessionCookie(idToken);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}

// DELETE /api/auth/session  — sign out
export async function DELETE() {
  try {
    await clearSessionCookie();
  } catch {}
  return NextResponse.json({ ok: true });
}

