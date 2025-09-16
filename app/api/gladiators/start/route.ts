import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/firebase/request-auth";
import { adminDb } from "@/lib/firebase/server";
import { SERVERS } from "@/data/servers";
import { FieldValue } from "firebase-admin/firestore";

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

    // Count existing gladiators and clamp to missing to avoid over-creation
    const existingSnap = await adminDb().collection('gladiators').where('ludusId', '==', ludusId).get();
    const existingCount = existingSnap.size;
    const missing = Math.max(0, minRequired - existingCount);

    // If already satisfied, no-op
    if (missing === 0) {
      return NextResponse.json({ ok: true, jobId: null, missing: 0, reason: 'already_satisfied' }, { status: 200 });
    }

    // Clamp requested count to missing
    const count = Math.min(requestedCount ?? missing, missing);

    // Avoid duplicate concurrent jobs for same ludus
    const pendingSnap = await adminDb()
      .collection('jobs')
      .where('type', '==', 'generateInitialGladiators')
      .where('ludusId', '==', ludusId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    if (!pendingSnap.empty) {
      return NextResponse.json({ ok: true, jobId: pendingSnap.docs[0].id, pending: true, missing }, { status: 202 });
    }

    const jobRef = adminDb().collection('jobs').doc();
    await jobRef.set({
      type: 'generateInitialGladiators',
      status: 'pending',
      ludusId,
      userId: user.uid,
      serverId: ludus.serverId,
      count,
      minRequired,
      existingCount,
      createdAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ ok: true, jobId: jobRef.id, count, missing }, { status: 202 });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.error('[api/gladiators/start] failed', e);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}

