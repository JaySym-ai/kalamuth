import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { getQuestDurationMinutes } from "@/lib/ludus/repository";
import { handleAPIError, badRequestResponse, notFoundResponse, internalErrorResponse } from "@/lib/api/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAuthAPI();

    const body = await req.json().catch(() => ({}));
    const questId = typeof body?.questId === 'string' ? body.questId.trim() : null;

    if (!questId) {
      return badRequestResponse("missing_quest_id");
    }

    // Fetch quest with ludus info
    const { data: quest, error: questErr } = await supabase
      .from('quests')
      .select('id, userId, ludusId, gladiatorId, status, reward')
      .eq('id', questId)
      .eq('userId', user.id)
      .maybeSingle();

    if (questErr || !quest) {
      return notFoundResponse("quest");
    }

    if (quest.status !== 'pending') {
      return badRequestResponse("quest_not_pending");
    }

    // Fetch ludus to get server config
    const { data: ludus, error: ludusErr } = await supabase
      .from('ludi')
      .select('serverId')
      .eq('id', quest.ludusId)
      .maybeSingle();

    if (ludusErr || !ludus) {
      return NextResponse.json({ error: "ludus_not_found" }, { status: 404 });
    }

    // Get quest duration from server config
    const questDurationMinutes = getQuestDurationMinutes(ludus.serverId);
    const questDurationMs = questDurationMinutes * 60 * 1000;

    // Update quest status to active
    const startTime = new Date();
    const { error: updateErr } = await supabase
      .from('quests')
      .update({
        status: 'active',
        startedAt: startTime.toISOString(),
        updatedAt: startTime.toISOString(),
      })
      .eq('id', questId);

    if (updateErr) {
      return internalErrorResponse(updateErr, "Failed to accept quest");
    }

    // Calculate completion time based on server config
    // In production, this should be handled by a background job/cron
    // For now, we'll just return the expected completion time
    const completionTime = new Date(startTime.getTime() + questDurationMs);

    return NextResponse.json({
      success: true,
      questId,
      startedAt: startTime.toISOString(),
      completionTime: completionTime.toISOString(),
      message: `Quest accepted! The gladiator will return in ${questDurationMinutes} minute${questDurationMinutes !== 1 ? 's' : ''}.`,
    });
  } catch (error) {
    return handleAPIError(error, "Quest acceptance error");
  }
}

