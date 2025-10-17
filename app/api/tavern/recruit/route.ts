import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { SERVERS } from "@/data/servers";
import { debug_error } from "@/utils/debug";
import { serializeError, nowIso } from "@/utils/errors";
import { getOpenRouterClient } from "@/lib/ai/client";
import { getExistingGladiatorNames } from "@/lib/gladiator/names";
import { generateAndInsertTavernGladiator } from "@/lib/gladiator/generation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAuthAPI();

    const body = await req.json().catch(() => ({}));
    const ludusId = typeof body?.ludusId === 'string' ? body.ludusId.trim() : null;
    const tavernGladiatorId = typeof body?.tavernGladiatorId === 'string' ? body.tavernGladiatorId.trim() : null;

    if (!ludusId || !tavernGladiatorId) {
      return NextResponse.json({ error: "missing_parameters" }, { status: 400 });
    }

    // Fetch ludus
    const { data: ludus, error: ludusErr } = await supabase
      .from('ludi')
      .select('id, userId, serverId, maxGladiators, gladiatorCount')
      .eq('id', ludusId)
      .maybeSingle();

    if (ludusErr || !ludus) return NextResponse.json({ error: "ludus_not_found" }, { status: 404 });
    if (ludus.userId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // Get actual gladiator count from database to avoid stale count issues
    const { count: actualGladiatorCount, error: countErr } = await supabase
      .from('gladiators')
      .select('id', { count: 'exact', head: true })
      .eq('ludusId', ludusId);

    if (countErr) {
      debug_error("Failed to count gladiators:", countErr);
      return NextResponse.json({ error: "count_failed" }, { status: 500 });
    }

    const currentCount = actualGladiatorCount ?? 0;
    const maxAllowed = ludus.maxGladiators ?? 0;

    // Check if ludus is full using actual count
    if (currentCount >= maxAllowed) {
      return NextResponse.json({ error: "ludus_full" }, { status: 400 });
    }

    // Fetch tavern gladiator - ensure it's from the correct server
    const serviceSupabase = createServiceRoleClient();
    const { data: tavernGladiator, error: tavernErr } = await serviceSupabase
      .from('tavern_gladiators')
      .select('*')
      .eq('id', tavernGladiatorId)
      .eq('ludusId', ludusId)
      .eq('serverId', ludus.serverId) // CRITICAL: Filter by current server to prevent cross-server contamination
      .maybeSingle();

    if (tavernErr || !tavernGladiator) {
      return NextResponse.json({ error: "gladiator_not_found" }, { status: 404 });
    }

    // Move tavern gladiator to main gladiators table (map explicitly and clamp health fields)
    const now = nowIso();
    const maxHealth = Math.max(30, Math.min(300, tavernGladiator.health ?? 30));
    const currentHealth = Math.min(Math.max(0, tavernGladiator.currentHealth ?? maxHealth), maxHealth);

    const insertData = {
      // relations
      ludusId: tavernGladiator.ludusId,
      userId: tavernGladiator.userId,
      serverId: tavernGladiator.serverId ?? null,
      // identity
      name: tavernGladiator.name,
      surname: tavernGladiator.surname,
      avatarUrl: tavernGladiator.avatarUrl,
      birthCity: tavernGladiator.birthCity,
      // vitals
      health: maxHealth,
      currentHealth,
      alive: tavernGladiator.alive ?? true,
      // attributes
      stats: tavernGladiator.stats,
      // narrative / conditions
      lifeGoal: tavernGladiator.lifeGoal,
      personality: tavernGladiator.personality,
      backstory: tavernGladiator.backstory,
      weakness: tavernGladiator.weakness,
      fear: tavernGladiator.fear,
      likes: tavernGladiator.likes,
      dislikes: tavernGladiator.dislikes,
      handicap: tavernGladiator.handicap ?? null,
      uniquePower: tavernGladiator.uniquePower ?? null,
      physicalCondition: tavernGladiator.physicalCondition,
      notableHistory: tavernGladiator.notableHistory,
      injury: tavernGladiator.injury ?? null,
      injuryTimeLeftHours: tavernGladiator.injuryTimeLeftHours ?? null,
      sickness: tavernGladiator.sickness ?? null,
      // combat / ranking
      rankingPoints: tavernGladiator.rankingPoints ?? 1000,
      rarity: tavernGladiator.rarity ?? 'common',
      // timestamps
      createdAt: now,
      updatedAt: now,
    } as const;

    const { error: insertErr } = await supabase.from('gladiators').insert(insertData);

    if (insertErr) {
      debug_error("Failed to insert gladiator:", insertErr);
      return NextResponse.json({ error: "recruitment_failed" }, { status: 500 });
    }

    // Delete from tavern using service role client to ensure deletion works
    const { error: deleteErr } = await serviceSupabase
      .from('tavern_gladiators')
      .delete()
      .eq('id', tavernGladiatorId);

    if (deleteErr) {
      debug_error("Failed to delete tavern gladiator:", deleteErr);
      return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
    }

    // Update ludus gladiator count using actual count
    const { error: updateErr } = await supabase
      .from('ludi')
      .update({ gladiatorCount: currentCount + 1, updatedAt: now })
      .eq('id', ludusId);

    if (updateErr) {
      debug_error("Failed to update ludus:", updateErr);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    // Generate replacement tavern gladiator immediately to maintain backup system
    try {
      const client = getOpenRouterClient();
      const server = SERVERS.find(s => s.id === ludus.serverId);
      const rarityConfig = server?.config.rarityConfig;
      const existingNames = await getExistingGladiatorNames(supabase, ludusId, ludus.serverId);

      await generateAndInsertTavernGladiator({
        client,
        jobId: `tavern-replace-${ludusId}-${Date.now()}`,
        existingNames,
        rarityConfig,
        supabase,
        userId: user.id,
        ludusId,
        serverId: ludus.serverId || null,
      });
    } catch (error) {
      const errorMsg = serializeError(error);
      debug_error(`[tavern/recruit] Failed to generate replacement gladiator: ${errorMsg}`);
      // Don't fail the recruitment if replacement generation fails
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (process.env.NODE_ENV !== 'production') debug_error('[api/tavern/recruit] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

