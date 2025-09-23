import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
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
    const requestedCount = typeof body?.count === 'number' && body.count > 0 ? Math.floor(body.count) : undefined;

    if (!ludusId) return NextResponse.json({ error: "missing_ludusId" }, { status: 400 });

    // Validate ludus ownership and get serverId
    const { data: ludus, error: ludusErr } = await supabase
      .from('ludi')
      .select('id,userId,serverId,gladiatorCount')
      .eq('id', ludusId)
      .maybeSingle();
    if (ludusErr) return NextResponse.json({ error: ludusErr.message }, { status: 500 });
    if (!ludus) return NextResponse.json({ error: 'ludus_not_found' }, { status: 404 });
    if (ludus.userId !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const server = SERVERS.find(s => s.id === ludus.serverId);
    const minRequired = server ? server.config.initialGladiatorsPerLudus : 3;

    // Count existing gladiators and clamp to missing to avoid over-creation
    const { count: existingCount, error: countErr } = await supabase
      .from('gladiators')
      .select('id', { count: 'exact', head: true })
      .eq('ludusId', ludusId);
    if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 });
    const missing = Math.max(0, (minRequired ?? 0) - (existingCount ?? 0));

    if (missing === 0) {
      return NextResponse.json({ ok: true, jobId: null, missing: 0, reason: 'already_satisfied' }, { status: 200 });
    }

    const count = Math.min(requestedCount ?? missing, missing);

    // Avoid duplicate concurrent jobs for same ludus
    const { data: pendingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('type', 'generateInitialGladiators')
      .eq('ludusId', ludusId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();
    if (pendingJob) {
      return NextResponse.json({ ok: true, jobId: pendingJob.id, pending: true, missing }, { status: 202 });
    }

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        type: 'generateInitialGladiators',
        status: 'pending',
        ludusId,
        userId: user.id,
        serverId: ludus.serverId,
        count,
        minRequired,
        existingCount,
        createdAt: nowIso(),
      })
      .select('id')
      .single();
    if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 });

    // From here on, we process the job directly in Next.js
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      await supabase
        .from('jobs')
        .update({ status: 'completed_with_errors', created: 0, errors: ['missing_openrouter_api_key'], finishedAt: nowIso() })
        .eq('id', job.id);
      return NextResponse.json({ error: 'config_missing' }, { status: 500 });
    }

    const client = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'X-Title': 'Kalamuth' } });

    // Recompute capacity at execution time
    const { count: execExistingCount } = await supabase
      .from('gladiators')
      .select('id', { count: 'exact', head: true })
      .eq('ludusId', ludusId);
    const execMissing = Math.max(0, (minRequired ?? 0) - (execExistingCount ?? 0));
    const toCreate = Math.min(count, execMissing);

    if (toCreate <= 0) {
      await supabase.from('jobs').update({ status: 'completed', created: 0, errors: [], finishedAt: nowIso() }).eq('id', job.id);
      return NextResponse.json({ ok: true, jobId: job.id, created: 0, missing: execMissing }, { status: 202 });
    }

    // Fetch existing gladiator names in this ludus to avoid duplicates
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
      let retries = 3; // Allow retries if we get a duplicate name
      let gladiatorCreated = false;

      while (retries > 0 && !gladiatorCreated) {
        try {
          const g = await generateOneGladiator(client, {
            jobId: job.id,
            attempt: i + 1,
            existingNames: Array.from(existingNames)
          });

          // Check if this name already exists
          const fullName = `${g.name} ${g.surname}`.replace(/\s+/g, ' ').trim().toLowerCase();
          if (existingNames.has(fullName)) {
            throw new Error(`Duplicate name generated: ${g.name} ${g.surname}`);
          }

          const now = nowIso();
          const { error: insErr } = await supabase.from('gladiators').insert({
            ...g,
            userId: user.id,
            ludusId,
            serverId: ludus.serverId || null,
            createdAt: now,
            updatedAt: now,
          });

          if (insErr) {
            // Check if it's a unique constraint violation
            if (insErr.message.includes('gladiators_ludus_fullname_unique')) {
              throw new Error(`Duplicate name in database: ${g.name} ${g.surname}`);
            }
            throw new Error(insErr.message);
          }

          // Success - add to our tracking set
          existingNames.add(fullName);
          created++;
          gladiatorCreated = true;
        } catch (e) {
          retries--;
          const msg = e instanceof Error ? e.message : String(e);

          if (retries === 0) {
            // Final failure after all retries
            if (process.env.NODE_ENV !== 'production') {
              console.error('Gladiator generation failed after retries', {
                jobId: job.id,
                attempt: i + 1,
                error: msg
              });
            }
            errors.push(msg);
          } else if (process.env.NODE_ENV !== 'production') {
            console.warn('Gladiator generation retry', {
              jobId: job.id,
              attempt: i + 1,
              retriesLeft: retries,
              error: msg
            });
          }
        }
      }
    }

    // Update ludus gladiatorCount approximately (existing + created)
    try {
      if (created > 0) {
        const { error: updErr } = await supabase
          .from('ludi')
          .update({ gladiatorCount: (execExistingCount ?? 0) + created, updatedAt: nowIso() })
          .eq('id', ludusId);
        if (updErr) throw new Error(updErr.message);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Failed to update ludus gladiatorCount', { jobId: job.id, ludusId, error: err instanceof Error ? err.message : String(err) });
      errors.push('Failed to update ludus gladiatorCount');
    }

    const finalStatus = errors.length ? 'completed_with_errors' : 'completed';
    await supabase
      .from('jobs')
      .update({ status: finalStatus, created, errors, finishedAt: nowIso() })
      .eq('id', job.id);

    return NextResponse.json({ ok: true, jobId: job.id, created, errors }, { status: 202 });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('[api/gladiators/start] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
