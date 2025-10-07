import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { LudusZ, type LudusFromZod } from "@/lib/ludus/schema";
import type { Ludus } from "@/types/ludus";
import { DEFAULT_SERVER_ID, SERVERS } from "@/data/servers";

function nowIso() {
  return new Date().toISOString();
}

function getLudusMaxGladiators(serverId: string): number {
  const s = SERVERS.find((s) => s.id === serverId) ?? SERVERS.find((s) => s.id === DEFAULT_SERVER_ID);
  return s?.config.ludusMaxGladiators ?? 5;
}

function withDefaults(input: Partial<Ludus> & { userId: string; serverId: string; name: string; logoUrl: string }): LudusFromZod {
  const maxGladiators = input.maxGladiators ?? getLudusMaxGladiators(input.serverId);
  const model: Ludus = {
    userId: input.userId,
    serverId: input.serverId,
    name: input.name,
    logoUrl: input.logoUrl,
    treasury: input.treasury ?? { currency: "sestertii", amount: 0 },
    reputation: input.reputation ?? 0,
    morale: input.morale ?? 50,
    facilities: input.facilities ?? { infirmaryLevel: 1, trainingGroundLevel: 1, quartersLevel: 1, kitchenLevel: 1 },
    maxGladiators,
    gladiatorCount: input.gladiatorCount ?? 0,
    motto: input.motto,
    locationCity: input.locationCity,
    createdAt: input.createdAt ?? nowIso(),
    updatedAt: input.updatedAt ?? nowIso(),
    isDeleted: input.isDeleted,
  };
  return LudusZ.parse(model);
}

async function supa() {
  return createClient(await cookies());
}

export async function listLudiByUser(userId: string, opts?: { serverId?: string }) {
  const s = await supa();
  let query = s.from("ludi").select("*").eq("userId", userId);
  if (opts?.serverId) query = query.eq("serverId", opts.serverId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as (Ludus & { id: string })[];
}

export async function getUserLudusOnServer(userId: string, serverId: string) {
  const s = await supa();
  const { data, error } = await s
    .from("ludi")
    .select("*")
    .eq("userId", userId)
    .eq("serverId", serverId)
    .limit(1)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data as Ludus & { id: string }) ?? null;
}

export async function createLudus(input: Partial<Ludus> & { userId: string; serverId: string; name: string; logoUrl: string }) {
  const s = await supa();
  const existing = await getUserLudusOnServer(input.userId, input.serverId);
  if (existing) return existing;

  const data = withDefaults(input);
  const { data: inserted, error } = await s.from("ludi").insert(data).select("*").single();
  if (error) throw error;
  const created = inserted as Ludus & { id: string };

  // NOTE: Initial gladiators are now generated asynchronously via /api/gladiators/start
  // called from the initial-gladiators page. This prevents duplicate creation.

  return created;
}

export async function updateLudus(id: string, patch: Partial<Ludus>) {
  const s = await supa();
  const updates = { ...patch, updatedAt: nowIso() };
  const { data, error } = await s.from("ludi").update(updates).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Ludus & { id: string };
}

export async function softDeleteLudus(id: string) {
  const s = await supa();
  await s.from("ludi").update({ isDeleted: true, updatedAt: nowIso() }).eq("id", id);
}

