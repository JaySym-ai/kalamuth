import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import OpenAI from "openai";
import { generateOneGladiator } from "@/lib/generation/generateGladiator";
import { SERVERS } from "@/data/servers";
import { rollRarity } from "@/lib/gladiator/rarity";

export const runtime = "nodejs";

function nowIso() { return new Date().toISOString(); }

export async function POST(req: Request) {
  try {
    const supabase = createClient(await cookies());
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "missing_api_key" }, { status: 500 });

    const client = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'X-Title': 'Kalamuth' } });

    // Get server config for rarity rolling
    const server = SERVERS.find(s => s.id === ludus.serverId);
    const rarityConfig = server?.config.rarityConfig;

    // Fetch existing gladiator names
    const { data: existingGladiators } = await supabase
      .from('gladiators')
      .select('name, surname')
      .eq('ludusId', ludusId);

    const existingNames = new Set<string>(
      (existingGladiators || []).map(g =>
        `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase()
      )
    );

    let newGladiator = null;
    let retries = 3;

    while (retries > 0 && !newGladiator) {
      try {
        // Roll rarity for new gladiator
        const rarity = rarityConfig ? rollRarity(rarityConfig) : 'common';

        const g = await generateOneGladiator(client, {
          jobId: `tavern-reroll-${ludusId}`,
          attempt: 1,
          existingNames: Array.from(existingNames),
          rarity
        });

        const fullName = `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase();
        if (!existingNames.has(fullName)) {
          newGladiator = g;
        } else {
          retries--;
        }
      } catch {
        retries--;
      }
    }

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
      console.error("Failed to delete old tavern gladiator:", deleteErr);
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
      console.error("Failed to insert new tavern gladiator:", insertErr);
      return NextResponse.json({ error: "insertion_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('[api/tavern/reroll] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

