import { NextResponse } from "next/server";
import { requireAuthAPI } from "@/lib/auth/server";
import { SERVERS } from "@/data/servers";
import { debug_error } from "@/utils/debug";
import { serializeError, nowIso } from "@/utils/errors";
import { getOpenRouterClient } from "@/lib/ai/client";
import { getExistingGladiatorNames } from "@/lib/gladiator/names";
import { generateGladiatorWithRetry } from "@/lib/gladiator/generation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user, supabase } = await requireAuthAPI();

    const body = await req.json().catch(() => ({}));
    const ludusId = typeof body?.ludusId === 'string' && body.ludusId.trim() ? body.ludusId.trim() : null;

    if (!ludusId) return NextResponse.json({ error: "missing_ludusId" }, { status: 400 });

    // Fetch ludus to verify ownership and get server config
    const { data: ludus, error: ludusErr } = await supabase
      .from('ludi')
      .select('id, userId, serverId')
      .eq('id', ludusId)
      .maybeSingle();

    if (ludusErr || !ludus) return NextResponse.json({ error: "ludus_not_found" }, { status: 404 });
    if (ludus.userId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // Check if tavern gladiators already exist - filter by current server to prevent cross-server contamination
    const { count: existingCount } = await supabase
      .from('tavern_gladiators')
      .select('id', { count: 'exact', head: true })
      .eq('ludusId', ludusId)
      .eq('serverId', ludus.serverId); // CRITICAL: Filter by current server

    if ((existingCount ?? 0) >= 2) {
      return NextResponse.json({ ok: true, created: 0, reason: 'already_satisfied' }, { status: 200 });
    }

    const toCreate = 2 - (existingCount ?? 0);
    
    let client;
    try {
      client = getOpenRouterClient();
    } catch {
      return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
    }

    // Get server config for rarity rolling
    const server = SERVERS.find(s => s.id === ludus.serverId);
    const rarityConfig = server?.config.rarityConfig;

    // Fetch existing gladiator names to avoid duplicates
    const existingNames = await getExistingGladiatorNames(supabase, ludusId, ludus.serverId);

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < toCreate; i++) {
      const gladiator = await generateGladiatorWithRetry({
        client,
        jobId: `tavern-${ludusId}`,
        existingNames,
        rarityConfig,
      });

      if (!gladiator) {
        errors.push(`Gladiator ${i + 1}: Failed after retries`);
        continue;
      }

      const now = nowIso();
      const { error: insErr } = await supabase.from('tavern_gladiators').insert({
        ...gladiator,
        userId: user.id,
        ludusId,
        serverId: ludus.serverId || null,
        createdAt: now,
        updatedAt: now,
      });

      if (insErr) {
        errors.push(`Gladiator ${i + 1}: ${serializeError(insErr)}`);
      } else {
        created++;
      }
    }

    return NextResponse.json({ ok: true, created, errors }, { status: 200 });
  } catch (e) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (process.env.NODE_ENV !== 'production') debug_error('[api/tavern/generate] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

