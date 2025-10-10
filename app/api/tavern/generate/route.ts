import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, createServiceRoleClient } from "@/utils/supabase/server";
import { SERVERS } from "@/data/servers";
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

    // Check if tavern gladiators already exist
    const { count: existingCount } = await supabase
      .from('tavern_gladiators')
      .select('id', { count: 'exact', head: true })
      .eq('ludusId', ludusId);

    if ((existingCount ?? 0) >= 3) {
      return NextResponse.json({ ok: true, created: 0, reason: 'already_satisfied' }, { status: 200 });
    }

    const toCreate = 3 - (existingCount ?? 0);
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "missing_api_key" }, { status: 500 });

    const client = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'X-Title': 'Kalamuth' } });

    // Fetch existing gladiator names to avoid duplicates
    const { data: existingGladiators } = await supabase
      .from('gladiators')
      .select('name, surname')
      .eq('ludusId', ludusId);

    const existingNames = new Set<string>(
      (existingGladiators || []).map(g =>
        `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase()
      )
    );

    let created = 0;
    const errors: string[] = [];

    for (let i = 0; i < toCreate; i++) {
      let retries = 3;
      let gladiatorCreated = false;

      while (retries > 0 && !gladiatorCreated) {
        try {
          const g = await generateOneGladiator(client, {
            jobId: `tavern-${ludusId}`,
            attempt: i + 1,
            existingNames: Array.from(existingNames)
          });

          const fullName = `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase();
          if (existingNames.has(fullName)) {
            throw new Error(`Duplicate name generated: ${g.name} ${g.surname}`);
          }

          const now = nowIso();
          const { error: insErr } = await supabase.from('tavern_gladiators').insert({
            ...g,
            userId: user.id,
            ludusId,
            serverId: ludus.serverId || null,
            createdAt: now,
            updatedAt: now,
          });

          if (insErr) throw insErr;

          existingNames.add(fullName);
          created++;
          gladiatorCreated = true;
        } catch (e) {
          retries--;
          if (retries === 0) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            errors.push(`Gladiator ${i + 1}: ${errorMsg}`);
          }
        }
      }
    }

    return NextResponse.json({ ok: true, created, errors }, { status: 200 });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('[api/tavern/generate] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

