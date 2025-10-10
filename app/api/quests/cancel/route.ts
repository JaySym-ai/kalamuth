import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { debug_log, debug_error, debug_warn, debug_info } from "@/utils/debug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CANCEL_COST = 2; // sestertii

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
      .select('id, userId, ludusId, status')
      .eq('id', questId)
      .eq('userId', user.id)
      .maybeSingle();

    if (questErr || !quest) {
      return NextResponse.json({ error: "quest_not_found" }, { status: 404 });
    }

    if (quest.status !== 'active') {
      return NextResponse.json({ error: "quest_not_active" }, { status: 400 });
    }

    // Fetch ludus to check treasury
    const { data: ludus, error: ludusErr } = await supabase
      .from('ludi')
      .select('treasury')
      .eq('id', quest.ludusId)
      .maybeSingle();

    if (ludusErr || !ludus) {
      return NextResponse.json({ error: "ludus_not_found" }, { status: 404 });
    }

    const treasury = ludus.treasury as { currency: string; amount: number };
    if (treasury.amount < CANCEL_COST) {
      return NextResponse.json(
        { error: "insufficient_funds", required: CANCEL_COST, available: treasury.amount },
        { status: 400 }
      );
    }

    // Deduct cost from treasury
    const serviceSupabase = createServiceRoleClient();
    const newAmount = treasury.amount - CANCEL_COST;

    await serviceSupabase
      .from('ludi')
      .update({
        treasury: {
          currency: treasury.currency || 'sestertii',
          amount: newAmount,
        },
      })
      .eq('id', quest.ludusId);

    // Update quest status to cancelled
    const cancelTime = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('quests')
      .update({
        status: 'cancelled',
        completedAt: cancelTime,
        updatedAt: cancelTime,
      })
      .eq('id', questId);

    if (updateErr) {
      return NextResponse.json({ error: "failed_to_cancel_quest" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      questId,
      message: `Quest cancelled. ${CANCEL_COST} sestertii deducted.`,
      newTreasuryAmount: newAmount,
    });
  } catch (error) {
    debug_error("Quest cancellation error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

