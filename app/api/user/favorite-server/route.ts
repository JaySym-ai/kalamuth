import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { handleAPIError, badRequestResponse, internalErrorResponse } from "@/lib/api/errors";

export const runtime = "nodejs";

/**
 * GET /api/user/favorite-server
 * Returns the user's favorite server ID
 */
export async function GET() {
  try {
    const { user: u, supabase } = await requireAuthAPI();

    const { data: userRow, error } = await supabase
      .from("users")
      .select("favoriteServerId")
      .eq("id", u.id)
      .maybeSingle();

    if (error) {
      return internalErrorResponse(error, "Failed to fetch favorite server");
    }

    return NextResponse.json({
      favoriteServerId: userRow?.favoriteServerId ?? null,
    });
  } catch (error) {
    return handleAPIError(error, "Failed to fetch favorite server");
  }
}

/**
 * POST /api/user/favorite-server
 * Sets the user's favorite server
 */
export async function POST(req: Request) {
  try {
    const { user: u, supabase } = await requireAuthAPI();

    const body = await req.json();
    const { serverId } = body;

    if (!serverId) {
      return badRequestResponse("serverId is required");
    }

    // Note: We allow setting favorite server even without a ludus
    // This enables users to switch servers to create new ludus

    // Update favorite server
    const { error: updateError } = await supabase
      .from("users")
      .update({ favoriteServerId: serverId })
      .eq("id", u.id);

    if (updateError) {
      return internalErrorResponse(updateError, "Failed to update favorite server");
    }

    return NextResponse.json({ ok: true, favoriteServerId: serverId });
  } catch (error) {
    return handleAPIError(error, "Failed to update favorite server");
  }
}

