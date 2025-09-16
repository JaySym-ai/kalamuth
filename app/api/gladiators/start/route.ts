import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/firebase/request-auth";
import { adminDb } from "@/lib/firebase/server";
import { SERVERS } from "@/data/servers";

export async function POST(req: Request) {
  try {
    const user = await getRequestUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ludusId = typeof body?.ludusId === 'string' && body.ludusId.trim() ? body.ludusId.trim() : null;
    const requestedCount = typeof body?.count === 'number' && body.count > 0 ? Math.floor(body.count) : undefined;

    if (!ludusId) return NextResponse.json({ error: "missing_ludusId" }, { status: 400 });

    // Validate ludus ownership and get serverId
    const ludusDoc = await adminDb().collection('ludi').doc(ludusId).get();
    if (!ludusDoc.exists) return NextResponse.json({ error: "ludus_not_found" }, { status: 404 });
    const ludus = ludusDoc.data() as { userId: string; serverId: string };
    if (ludus.userId !== user.uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const server = SERVERS.find(s => s.id === ludus.serverId);
    const minRequired = server ? server.config.initialGladiatorsPerLudus : 3;
    const count = requestedCount ?? minRequired;

    const jobRef = await adminDb().collection('jobs/generateInitialGladiators').doc();
    await jobRef.set({
      type: 'generateInitialGladiators',
      status: 'pending',
      ludusId,
      userId: user.uid,
      serverId: ludus.serverId,
      count,
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ ok: true, jobId: jobRef.id, count }, { status: 202 });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('[api/gladiators/start] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

