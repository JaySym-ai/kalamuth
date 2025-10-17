import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { unauthorizedResponse, internalErrorResponse } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user: u, supabase } = await requireAuthAPI();

  // Get user data
  const { data: userRow } = await supabase
    .from("users")
    .select("onboardingDone")
    .eq("id", u.id)
    .maybeSingle();

  // Check if user has a ludus
  const { data: ludusRow } = await supabase
    .from("ludi")
    .select("id")
    .eq("userId", u.id)
    .limit(1)
    .maybeSingle();

  const hasLudus = Boolean(ludusRow);

  return NextResponse.json({
    onboardingDone: Boolean(userRow?.onboardingDone),
    hasLudus,
  });
  } catch {
    return unauthorizedResponse();
  }
}

export async function POST(req: Request) {
  try {
    const { user: u, supabase } = await requireAuthAPI();

  const body = await req.json().catch(() => ({}));
  const onboardingDone = typeof body?.onboardingDone === "boolean" ? body.onboardingDone : false;

  const { error } = await supabase
    .from("users")
    .upsert({ id: u.id, onboardingDone })
    .eq("id", u.id);

  if (error) return internalErrorResponse(error, "Failed to update user onboarding status");
  return NextResponse.json({ ok: true });
  } catch {
    return unauthorizedResponse();
  }
}

