import { NextRequest, NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { badRequestResponse, handleAPIError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAuthAPI();
    const { ludusId } = await request.json();

    if (!ludusId) {
      return badRequestResponse("ludusId_required");
    }

    // Get all completed quests for this ludus, ordered by creation date (newest first)
    const { data: allQuests, error: fetchError } = await supabase
      .from("quests")
      .select("id")
      .eq("ludusId", ludusId)
      .in("status", ["completed", "failed", "cancelled"])
      .order("createdAt", { ascending: false });

    if (fetchError) {
      throw new Error(`Failed to fetch quests: ${fetchError.message}`);
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
          throw new Error(`Failed to delete old quests: ${deleteError.message}`);
        }

        console.log(`Cleaned up ${questsToDelete.length} old quests for ludus ${ludusId}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleAPIError(error, "Quests cleanup");
  }
}