import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import OpenAI from "openai";
import { generateOneGladiator } from "@/lib/generation/generateGladiator";
import { SERVERS } from "@/data/servers";
import { rollRarity } from "@/lib/gladiator/rarity";
import { debug_error, debug_log, debug_warn } from "@/utils/debug";

export const runtime = "nodejs";

function nowIso() { return new Date().toISOString(); }

function serializeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

const SKIP_COST = 1; // Cost in sestertii to skip a gladiator

export async function POST(req: Request) {
  try {
    const supabase = createClient(await cookies());
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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
    let newGladiator = null;
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: "missing_api_key" }, { status: 500 });
      }

      const client = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: { 'X-Title': 'Kalamuth' },
        timeout: 60000 // 60 second timeout
      });

      // Get server config for rarity rolling
      const server = SERVERS.find(s => s.id === ludus.serverId);
      const rarityConfig = server?.config.rarityConfig;

      // Fetch existing gladiator names (including tavern gladiators)
      const { data: existingGladiators } = await supabase
        .from('gladiators')
        .select('name, surname')
        .eq('ludusId', ludusId);

      const { data: existingTavernGladiators } = await supabase
        .from('tavern_gladiators')
        .select('name, surname')
        .eq('ludusId', ludusId)
        .eq('serverId', ludus.serverId) // CRITICAL: Filter by current server to prevent cross-server contamination
        .neq('id', currentGladiatorId); // Exclude the one we're about to delete

      const existingNames = new Set<string>(
        [
          ...(existingGladiators || []),
          ...(existingTavernGladiators || [])
        ].map(g =>
          `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase()
        )
      );

      let retries = 3;
      let lastError: unknown = null;
      while (retries > 0 && !newGladiator) {
        try {
          // Roll rarity for replacement gladiator
          const rarity = rarityConfig ? rollRarity(rarityConfig) : 'common';

          const g = await generateOneGladiator(client, {
            jobId: `tavern-next-${ludusId}`,
            attempt: 1,
            existingNames: Array.from(existingNames),
            rarity
          });

          const fullName = `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase();
          if (!existingNames.has(fullName)) {
            const now = nowIso();
            const { data: insertedGladiator, error: insertErr } = await supabase
              .from('tavern_gladiators')
              .insert({
                ...g,
                userId: user.id,
                ludusId,
                serverId: ludus.serverId || null,
                createdAt: now,
                updatedAt: now,
              })
              .select()
              .single();

            if (insertErr) {
              lastError = insertErr;
              const errorMsg = serializeError(insertErr);
              debug_error(`[tavern/next] Failed to insert replacement gladiator (retry ${4 - retries}/3): ${errorMsg}`);
              retries--;
              continue;
            }

            newGladiator = insertedGladiator;
            debug_log(`[tavern/next] Successfully generated and inserted replacement gladiator: ${fullName}`);
          } else {
            lastError = `Duplicate name generated: ${fullName}`;
            debug_warn(`[tavern/next] Duplicate name generated (retry ${4 - retries}/3): ${fullName}`);
            retries--;
          }
        } catch (e) {
          lastError = e;
          const errorMsg = serializeError(e);
          debug_error(`[tavern/next] Error generating replacement gladiator (retry ${4 - retries}/3): ${errorMsg}`);
          retries--;
        }
      }

      if (!newGladiator) {
        const errorMsg = serializeError(lastError);
        debug_error(`[tavern/next] Failed to generate replacement gladiator after 3 retries. Last error: ${errorMsg}`);
        return NextResponse.json({ error: "failed_to_generate_replacement" }, { status: 500 });
      }
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
    if (process.env.NODE_ENV !== 'production') debug_error('[api/tavern/next] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

