import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { Ludus } from "@/types/ludus";
import { SERVERS } from "@/data/servers";
import { handleAPIError, badRequestResponse } from "@/lib/api/errors";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAuthAPI();
    const body = await req.json();
    const { name, logoUrl, serverId, locationCity, motto } = body;

    if (!name || !logoUrl || !serverId) {
      return badRequestResponse("Missing required fields");
    }

    // Ensure user doesn't already have a ludus on this server
    const { data: existing } = await supabase
      .from("ludi")
      .select("id")
      .eq("userId", user.id)
      .eq("serverId", serverId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return badRequestResponse("User already has a ludus on this server");
    }

    const server = SERVERS.find((s) => s.id === serverId);
    if (!server) {
      return badRequestResponse("Invalid server");
    }

    const now = new Date().toISOString();
    const newLudus: Ludus = {
      userId: user.id,
      serverId,
      name: String(name).trim(),
      logoUrl,
      treasury: { currency: "sestertii", amount: 1000 },
      reputation: 50,
      morale: 75,
      facilities: { infirmaryLevel: 1, trainingGroundLevel: 1, quartersLevel: 1, kitchenLevel: 1 },
      maxGladiators: server.config.ludusMaxGladiators,
      gladiatorCount: 0,
      locationCity: locationCity || "Rome",
      motto: motto || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Use service role for system operations
    const serviceRole = createServiceRoleClient();
    const { data: inserted, error } = await serviceRole
      .from("ludi")
      .insert(newLudus)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      ludusId: inserted.id,
      serverId,
      initialGladiatorCount: server.config.initialGladiatorsPerLudus,
    });
  } catch (error) {
    return handleAPIError(error, "Failed to create ludus");
  }
}
