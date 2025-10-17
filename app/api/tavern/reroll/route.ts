import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { SERVERS } from "@/data/servers";
import { debug_error } from "@/utils/debug";
import { nowIso } from "@/utils/errors";
import { getOpenRouterClient } from "@/lib/ai/client";
import { getExistingGladiatorNames } from "@/lib/gladiator/names";
import { generateGladiatorWithRetry } from "@/lib/gladiator/generation";

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
      .select('id, userId, serverId')
      .eq('id', ludusId)
      .maybeSingle();

    if (ludusErr || !ludus) return NextResponse.json({ error: "ludus_not_found" }, { status: 404 });
    if (ludus.userId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // Fetch tavern gladiator
    const { data: tavernGladiator, error: tavernErr } = await supabase
      .from('tavern_gladiators')
      .select('*')
      .eq('id', tavernGladiatorId)
      .eq('ludusId', ludusId)
      .maybeSingle();

    if (tavernErr || !tavernGladiator) {
      return NextResponse.json({ error: "gladiator_not_found" }, { status: 404 });
    }

    // Generate new gladiator
    let client;
    try {
      client = getOpenRouterClient();
    } catch {
      return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
    }

    // Get server config for rarity rolling
    const server = SERVERS.find(s => s.id === ludus.serverId);
    const rarityConfig = server?.config.rarityConfig;

    // Fetch existing gladiator names
    const existingNames = await getExistingGladiatorNames(supabase, ludusId, ludus.serverId);

    const newGladiator = await generateGladiatorWithRetry({
      client,
      jobId: `tavern-reroll-${ludusId}`,
      existingNames,
      rarityConfig,
    });

    if (!newGladiator) {
      return NextResponse.json({ error: "generation_failed" }, { status: 500 });
    }

    // Delete old tavern gladiator using service role client to ensure deletion works
    const serviceSupabase = createServiceRoleClient();
    const { error: deleteErr } = await serviceSupabase
      .from('tavern_gladiators')
      .delete()
      .eq('id', tavernGladiatorId);

    if (deleteErr) {
      debug_error("Failed to delete old tavern gladiator:", deleteErr);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }

    // Insert new tavern gladiator
    const now = nowIso();
    const { error: insertErr } = await supabase.from('tavern_gladiators').insert({
      ...newGladiator,
      userId: user.id,
      ludusId,
      serverId: ludus.serverId || null,
      createdAt: now,
      updatedAt: now,
    });

    if (insertErr) {
      debug_error("Failed to insert new tavern gladiator:", insertErr);
      return NextResponse.json({ error: "insertion_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (process.env.NODE_ENV !== 'production') debug_error('[api/tavern/reroll] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

