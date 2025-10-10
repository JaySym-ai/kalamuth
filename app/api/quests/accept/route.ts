import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = createClient(await cookies());
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const questId = typeof body?.questId === 'string' ? body.questId.trim() : null;

    if (!questId) {
      return NextResponse.json({ error: "missing_quest_id" }, { status: 400 });
    }

    // Fetch quest
    const { data: quest, error: questErr } = await supabase
      .from('quests')
      .select('id, userId, ludusId, gladiatorId, status, reward')
      .eq('id', questId)
      .eq('userId', user.id)
      .maybeSingle();

    if (questErr || !quest) {
      return NextResponse.json({ error: "quest_not_found" }, { status: 404 });
    }

    if (quest.status !== 'pending') {
      return NextResponse.json({ error: "quest_not_pending" }, { status: 400 });
    }

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
      return NextResponse.json({ error: "failed_to_accept_quest" }, { status: 500 });
    }

    // Schedule quest completion after 1 hour (3600000 ms)
    // In production, this should be handled by a background job/cron
    // For now, we'll just return the expected completion time
    const completionTime = new Date(startTime.getTime() + 3600000);

    return NextResponse.json({
      success: true,
      questId,
      startedAt: startTime.toISOString(),
      completionTime: completionTime.toISOString(),
      message: "Quest accepted! The gladiator will return in 1 hour.",
    });
  } catch (error) {
    console.error("Quest acceptance error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

