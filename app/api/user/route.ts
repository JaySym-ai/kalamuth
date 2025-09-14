import {NextResponse} from "next/server";
import {adminDb} from "@/lib/firebase/server";
import {getRequestUser} from "@/lib/firebase/request-auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({error: "unauthorized"}, {status: 401});
  const snap = await adminDb().collection("users").doc(user.uid).get();
  const data = snap.exists ? snap.data() as {onboardingDone?: boolean} : {};
  return NextResponse.json({ onboardingDone: Boolean(data.onboardingDone) });
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({error: "unauthorized"}, {status: 401});
  const ref = adminDb().collection("users").doc(user.uid);
  const body = await req.json().catch(() => ({}));
  const onboardingDone = typeof body?.onboardingDone === "boolean" ? body.onboardingDone : false;
  await ref.set({ onboardingDone }, { merge: true });
  return NextResponse.json({ ok: true });
}

