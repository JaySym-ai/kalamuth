import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { ludusId } = await request.json();

    if (!ludusId) {
      return NextResponse.json({ error: "ludusId is required" }, { status: 400 });
    }

    // Get all completed quests for this ludus, ordered by creation date (newest first)
    const { data: allQuests, error: fetchError } = await supabase
      .from("quests")
      .select("id")
      .eq("ludusId", ludusId)
      .in("status", ["completed", "failed", "cancelled"])
      .order("createdAt", { ascending: false });

    if (fetchError) {
      console.error("Error fetching quests for cleanup:", fetchError);
      return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
    }

    // If there are more than 3 completed quests, delete the oldest ones
    if (allQuests && allQuests.length > 3) {
      const questsToDelete = allQuests.slice(3); // Get all quests after the first 3
      
      if (questsToDelete.length > 0) {
        const questIdsToDelete = questsToDelete.map(quest => quest.id);
        
        const { error: deleteError } = await supabase
          .from("quests")
          .delete()
          .in("id", questIdsToDelete);

        if (deleteError) {
          console.error("Error deleting old quests:", deleteError);
          return NextResponse.json({ error: "Failed to delete old quests" }, { status: 500 });
        }

        console.log(`Cleaned up ${questsToDelete.length} old quests for ludus ${ludusId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quest cleanup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}