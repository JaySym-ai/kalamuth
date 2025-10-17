import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";

export const runtime = "nodejs";

/**
 * GET /api/user/servers
 * Returns list of servers where user has ludus
 */
export async function GET() {
  try {
    const { user: u, supabase } = await requireAuthAPI();

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
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

