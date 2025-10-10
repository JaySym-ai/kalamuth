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

    // Check if ludus is full
    if ((ludus.gladiatorCount ?? 0) >= (ludus.maxGladiators ?? 0)) {
      return NextResponse.json({ error: "ludus_full" }, { status: 400 });
    }

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

    // Move tavern gladiator to main gladiators table
    const now = nowIso();
    const { error: insertErr } = await supabase.from('gladiators').insert({
      ...tavernGladiator,
      createdAt: now,
      updatedAt: now,
    });

    if (insertErr) {
      console.error("Failed to insert gladiator:", insertErr);
      return NextResponse.json({ error: "recruitment_failed" }, { status: 500 });
    }

    // Delete from tavern using service role client to ensure deletion works
    const serviceSupabase = createServiceRoleClient();
    const { error: deleteErr } = await serviceSupabase
      .from('tavern_gladiators')
      .delete()
      .eq('id', tavernGladiatorId);

    if (deleteErr) {
      console.error("Failed to delete tavern gladiator:", deleteErr);
      return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
    }

    // Update ludus gladiator count
    const { error: updateErr } = await supabase
      .from('ludi')
      .update({ gladiatorCount: (ludus.gladiatorCount ?? 0) + 1, updatedAt: now })
      .eq('id', ludusId);

    if (updateErr) {
      console.error("Failed to update ludus:", updateErr);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }

    // Generate replacement tavern gladiator
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      try {
        const client = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'X-Title': 'Kalamuth' } });

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
              jobId: `tavern-replace-${ludusId}`,
              attempt: 1,
              existingNames: Array.from(existingNames)
            });

            const fullName = `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase();
            if (!existingNames.has(fullName)) {
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
          } catch (e) {
            retries--;
          }
        }
      } catch (e) {
        console.error("Failed to generate replacement gladiator:", e);
        // Don't fail the recruitment if replacement generation fails
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('[api/tavern/recruit] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

