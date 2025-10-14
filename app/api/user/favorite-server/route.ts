import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/user/favorite-server
 * Returns the user's favorite server ID
 */
export async function GET() {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { data: userRow, error } = await supabase
      .from("users")
      .select("favoriteServerId")
      .eq("id", u.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      favoriteServerId: userRow?.favoriteServerId ?? null,
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/favorite-server
 * Sets the user's favorite server
 */
export async function POST(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { serverId } = body;

    if (!serverId) {
      return NextResponse.json(
        { error: "serverId is required" },
        { status: 400 }
      );
    }

    // Note: We allow setting favorite server even without a ludus
    // This enables users to switch servers to create new ludus

    // Update favorite server
    const { error: updateError } = await supabase
      .from("users")
      .update({ favoriteServerId: serverId })
      .eq("id", u.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, favoriteServerId: serverId });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

