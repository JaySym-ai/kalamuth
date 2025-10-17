import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { SERVERS } from "@/data/servers";
import { debug_error } from "@/utils/debug";
import { serializeError } from "@/utils/errors";
import { getOpenRouterClient } from "@/lib/ai/client";
import { getExistingGladiatorNames } from "@/lib/gladiator/names";
import { generateAndInsertTavernGladiator } from "@/lib/gladiator/generation";

export const runtime = "nodejs";

const SKIP_COST = 1; // Cost in sestertii to skip a gladiator

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAuthAPI();

    const body = await req.json().catch(() => ({}));
    const ludusId = typeof body?.ludusId === 'string' ? body.ludusId.trim() : null;
    const currentGladiatorId = typeof body?.currentGladiatorId === 'string' ? body.currentGladiatorId.trim() : null;

    if (!ludusId || !currentGladiatorId) {
      return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
    }

    // Fetch ludus
    const { data: ludus, error: ludusErr } = await supabase
      .from('ludi')
      .select('id, userId, serverId')
      .eq('id', ludusId)
      .maybeSingle();

    if (ludusErr || !ludus) return NextResponse.json({ error: "ludus_not_found" }, { status: 404 });
    if (ludus.userId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // Fetch current gladiator to verify ownership - ensure it's from the correct server
    const { data: currentGladiator, error: currentErr } = await supabase
      .from('tavern_gladiators')
      .select('id')
      .eq('id', currentGladiatorId)
      .eq('ludusId', ludusId)
      .eq('serverId', ludus.serverId) // CRITICAL: Filter by current server to prevent cross-server contamination
      .maybeSingle();

    if (currentErr || !currentGladiator) {
      return NextResponse.json({ error: "gladiator_not_found" }, { status: 404 });
    }

    // Deduct skip cost from treasury
    const { data: ludusData, error: ludusDataErr } = await supabase
      .from('ludi')
      .select('treasury')
      .eq('id', ludusId)
      .maybeSingle();

    if (ludusDataErr || !ludusData) {
      return NextResponse.json({ error: "ludus_data_not_found" }, { status: 404 });
    }

    const treasury = ludusData.treasury as { currency?: string; amount: number } | null;
    const currentAmount = treasury?.amount ?? 0;

    if (currentAmount < SKIP_COST) {
      return NextResponse.json({ error: "insufficient_funds" }, { status: 400 });
    }

    // Deduct cost from treasury
    const serviceSupabase = createServiceRoleClient();
    const newAmount = currentAmount - SKIP_COST;

    const { error: updateErr } = await serviceSupabase
      .from('ludi')
      .update({
        treasury: {
          currency: treasury?.currency || 'sestertii',
          amount: newAmount,
        },
      })
      .eq('id', ludusId);

    if (updateErr) {
      return NextResponse.json({ error: "failed_to_deduct_cost" }, { status: 500 });
    }

    // Generate replacement gladiator FIRST (synchronously)
    let newGladiator;
    try {
      const client = getOpenRouterClient();
      const server = SERVERS.find(s => s.id === ludus.serverId);
      const rarityConfig = server?.config.rarityConfig;
      const existingNames = await getExistingGladiatorNames(supabase, ludusId, ludus.serverId, currentGladiatorId);

      const result = await generateAndInsertTavernGladiator({
        client,
        jobId: `tavern-next-${ludusId}`,
        existingNames,
        rarityConfig,
        supabase,
        userId: user.id,
        ludusId,
        serverId: ludus.serverId || null,
      });

      if (!result.success) {
        return NextResponse.json({ error: "failed_to_generate_replacement" }, { status: 500 });
      }

      newGladiator = result.data;
    } catch (error) {
      const errorMsg = serializeError(error);
      debug_error(`[tavern/next] Failed to generate replacement gladiator: ${errorMsg}`);
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    // Now delete the current (skipped) gladiator using service role - ensure it's from the correct server
    const { error: deleteErr } = await serviceSupabase
      .from('tavern_gladiators')
      .delete()
      .eq('id', currentGladiatorId)
      .eq('serverId', ludus.serverId); // CRITICAL: Only delete from current server

    if (deleteErr) {
      debug_error("Failed to delete skipped gladiator:", deleteErr);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, newGladiator }, { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (process.env.NODE_ENV !== 'production') debug_error('[api/tavern/next] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

