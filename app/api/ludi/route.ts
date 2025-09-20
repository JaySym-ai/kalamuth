import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createLudus, listLudiByUser } from "@/lib/ludus/repository";
import { DEFAULT_SERVER_ID } from "@/data/servers";

export const runtime = "nodejs";

// GET /api/ludi?serverId=alpha-1 — list current user's ludi (optionally filtered by server)
export async function GET(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const serverId = url.searchParams.get("serverId") || undefined;
  const ludi = await listLudiByUser(u.id, { serverId: serverId || undefined });
  return NextResponse.json({ ludi });
}

// POST /api/ludi  { name: string, logoUrl: string, serverId?: string }
// Creates a new ludus for the authenticated user on the specified server.
// If the user already has a ludus on that server, returns the existing one (idempotent).
export async function POST(req: Request) {
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  const u = auth.user;
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === "string" && body.name.trim().length > 0 ? body.name.trim() : "Ludus";
  const logoUrl = typeof body?.logoUrl === "string" ? body.logoUrl : "https://placehold.co/256x256?text=Ludus";
  const serverId = typeof body?.serverId === "string" && body.serverId.trim() ? body.serverId : DEFAULT_SERVER_ID;

  try {
    const ludus = await createLudus({ userId: u.id, serverId, name, logoUrl });
    return NextResponse.json({ ludus }, { status: 201 });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.error("[ludi] create failed", err);
    return NextResponse.json({ error: "failed_to_create" }, { status: 400 });
  }
}

