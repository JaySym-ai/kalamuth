import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import OpenAI from "openai";
import { generateOneGladiator } from "@/lib/generation/generateGladiator";

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

    // Fetch current gladiator to verify ownership
    const { data: currentGladiator, error: currentErr } = await supabase
      .from('tavern_gladiators')
      .select('id')
      .eq('id', currentGladiatorId)
      .eq('ludusId', ludusId)
      .maybeSingle();

    if (currentErr || !currentGladiator) {
      return NextResponse.json({ error: "gladiator_not_found" }, { status: 404 });
    }

    // Delete the current (skipped) gladiator using service role
    const serviceSupabase = createServiceRoleClient();
    const { error: deleteErr } = await serviceSupabase
      .from('tavern_gladiators')
      .delete()
      .eq('id', currentGladiatorId);

    if (deleteErr) {
      console.error("Failed to delete skipped gladiator:", deleteErr);
      return NextResponse.json({ error: "delete_failed" }, { status: 500 });
    }

    // Generate replacement gladiator asynchronously in the background
    // Don't wait for this to complete - return immediately
    (async () => {
      try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) return;

        const client = new OpenAI({
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: { 'X-Title': 'Kalamuth' }
        });

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

        let retries = 3;
        while (retries > 0) {
          try {
            const g = await generateOneGladiator(client, {
              jobId: `tavern-next-${ludusId}`,
              attempt: 1,
              existingNames: Array.from(existingNames)
            });

            const fullName = `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase();
            if (!existingNames.has(fullName)) {
              const now = nowIso();
              await supabase.from('tavern_gladiators').insert({
                ...g,
                userId: user.id,
                ludusId,
                serverId: ludus.serverId || null,
                createdAt: now,
                updatedAt: now,
              });
              break;
            }
            retries--;
          } catch {
            retries--;
          }
        }
      } catch (error) {
        console.error("Failed to generate replacement gladiator in background:", error);
        // Silently fail - don't affect the user's experience
      }
    })();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('[api/tavern/next] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

