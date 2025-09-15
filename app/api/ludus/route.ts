import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/server";
import { getRequestUser } from "@/lib/firebase/request-auth";
import { Ludus } from "@/types/ludus";
import { SERVERS } from "@/data/servers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  console.log("POST /api/ludus - Starting request");

  const user = await getRequestUser(req);
  console.log("User authenticated:", user?.uid);

  if (!user) {
    console.log("No user found, returning 401");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);
    const { name, logoUrl, serverId, locationCity, motto } = body;

    // Validate required fields
    if (!name || !logoUrl || !serverId) {
      console.log("Missing required fields:", { name: !!name, logoUrl: !!logoUrl, serverId: !!serverId });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has a ludus
    console.log("Checking for existing ludus for user:", user.uid, "on server:", serverId);
    const existingLudus = await adminDb()
      .collection("ludi")
      .where("userId", "==", user.uid)
      .where("serverId", "==", serverId)
      .limit(1)
      .get();

    console.log("Existing ludus found:", !existingLudus.empty);
    if (!existingLudus.empty) {
      console.log("User already has a ludus on this server");
      return NextResponse.json(
        { error: "User already has a ludus on this server" },
        { status: 400 }
      );
    }

    // Get server config
    const server = SERVERS.find(s => s.id === serverId);
    if (!server) {
      return NextResponse.json(
        { error: "Invalid server" },
        { status: 400 }
      );
    }

    // Create the ludus
    const now = new Date().toISOString();
    const newLudus: Ludus = {
      userId: user.uid,
      serverId,
      name: name.trim(),
      logoUrl,
      treasury: {
        currency: "sestertii",
        amount: 1000, // Starting money
      },
      reputation: 50,
      morale: 75,
      facilities: {
        infirmaryLevel: 1,
        trainingGroundLevel: 1,
        quartersLevel: 1,
        kitchenLevel: 1,
      },
      maxGladiators: server.config.ludusMaxGladiators,
      gladiatorCount: 0, // Will be updated when gladiators are generated
      locationCity: locationCity || "Rome",
      motto: motto || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Firestore
    console.log("Saving ludus to Firestore:", newLudus);
    const ludusRef = await adminDb().collection("ludi").add(newLudus);
    console.log("Ludus created with ID:", ludusRef.id);

    // Generate initial gladiators (this will be done in the next step)
    // For now, we'll just return the ludus ID

    return NextResponse.json({
      success: true,
      ludusId: ludusRef.id,
      serverId,
      initialGladiatorCount: server.config.initialGladiatorsPerLudus,
    });
  } catch (error) {
    console.error("Error creating ludus - Full error:", error);
    console.error("Error stack:", (error as Error).stack);
    return NextResponse.json(
      { error: "Failed to create ludus", details: (error as Error).message },
      { status: 500 }
    );
  }
}
