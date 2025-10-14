import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * GET /api/user/servers
 * Returns list of servers where user has ludus
 */
export async function GET() {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    // Get all ludus for this user across all servers
    const { data: ludusRecords, error } = await supabase
      .from("ludi")
      .select("serverId")
      .eq("userId", u.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Extract unique server IDs
    const ludusServers = [...new Set((ludusRecords ?? []).map((l) => l.serverId))];

    return NextResponse.json({
      ludusServers,
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

