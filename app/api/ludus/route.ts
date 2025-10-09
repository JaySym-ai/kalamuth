import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { Ludus } from "@/types/ludus";
import { SERVERS } from "@/data/servers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, logoUrl, serverId, locationCity, motto } = body;

    if (!name || !logoUrl || !serverId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "User already has a ludus on this server" },
        { status: 400 }
      );
    }

    const server = SERVERS.find((s) => s.id === serverId);
    if (!server) {
      return NextResponse.json(
        { error: "Invalid server" },
        { status: 400 }
      );
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
    return NextResponse.json(
      { error: "Failed to create ludus", details: (error as Error).message },
      { status: 500 }
    );
  }
}
