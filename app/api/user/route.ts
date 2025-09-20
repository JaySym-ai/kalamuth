import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
}

export async function POST(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const onboardingDone = typeof body?.onboardingDone === "boolean" ? body.onboardingDone : false;

  const { error } = await supabase
    .from("users")
    .upsert({ id: u.id, onboardingDone })
    .eq("id", u.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

