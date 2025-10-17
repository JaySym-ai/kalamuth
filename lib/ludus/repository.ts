import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { LudusZ, type LudusFromZod } from "@/lib/ludus/schema";
import type { Ludus } from "@/types/ludus";
import { DEFAULT_SERVER_ID, SERVERS } from "@/data/servers";
import { transformLudusData } from "./transform";

function nowIso() {
  return new Date().toISOString();
}

function getLudusMaxGladiators(serverId: string): number {
  const s = SERVERS.find((s) => s.id === serverId) ?? SERVERS.find((s) => s.id === DEFAULT_SERVER_ID);
  return s?.config.ludusMaxGladiators ?? 5;
}

export function getQuestDurationMinutes(serverId: string): number {
  const s = SERVERS.find((s) => s.id === serverId) ?? SERVERS.find((s) => s.id === DEFAULT_SERVER_ID);
  return s?.config.questDurationMinutes ?? 60;
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

/**
 * Get the user's current ludus based on their favorite server.
 * This function handles the server isolation logic:
 * 1. Fetches user's favoriteServerId
 * 2. Queries ludus for that server
 * 3. Falls back to any ludus if favorite server has no ludus
 * 4. Updates favoriteServerId if fallback is used
 *
 * @param userId - The user's ID
 * @param selectFields - Optional: specific fields to select (defaults to all fields)
 * @returns The user's current ludus or null if none exists
 */
export async function getCurrentUserLudus(
  userId: string,
  selectFields: string = "*"
): Promise<(Ludus & { id: string }) | null> {
  const s = await supa();

  // First, get user's favorite server
  const { data: userData } = await s
    .from("users")
    .select("favoriteServerId")
    .eq("id", userId)
    .maybeSingle();

  const favoriteServerId = userData?.favoriteServerId;

  // Fetch ludus from favorite server, or first available ludus if no favorite
  let query = s
    .from("ludi")
    .select(selectFields)
    .eq("userId", userId);

  if (favoriteServerId) {
    query = query.eq("serverId", favoriteServerId);
  }

  const { data: ludusData } = await query.limit(1).maybeSingle();
  let ludus: (Ludus & { id: string }) | null = ludusData ? (ludusData as unknown as Ludus & { id: string }) : null;

  if (!ludus) {
    // If we have a favorite server but no ludus there, fall back to any ludus
    if (favoriteServerId) {
      const { data: anyLudusData } = await s
        .from("ludi")
        .select(selectFields)
        .eq("userId", userId)
        .limit(1)
        .maybeSingle();

      if (anyLudusData) {
        const anyLudus = anyLudusData as unknown as Ludus & { id: string };
        // Use the first available ludus and update favorite server
        await s
          .from("users")
          .update({ favoriteServerId: anyLudus.serverId })
          .eq("id", userId);

        ludus = anyLudus;
      }
    }
  }

  return ludus;
}

/**
 * Get the user's current ludus with full data transformation.
 * This is a convenience wrapper around getCurrentUserLudus that:
 * 1. Fetches the ludus with server isolation logic
 * 2. Transforms the raw data into a properly typed Ludus object
 *
 * Use this when you need a fully transformed ludus object for display.
 *
 * @param userId - The user's ID
 * @returns Fully transformed ludus or null if none exists
 */
export async function getCurrentUserLudusTransformed(
  userId: string
): Promise<(Ludus & { id: string }) | null> {
  const selectFields = "id,userId,serverId,name,logoUrl,treasury,reputation,morale,facilities,maxGladiators,gladiatorCount,motto,locationCity,createdAt,updatedAt";
  const rawLudus = await getCurrentUserLudus(userId, selectFields);

  if (!rawLudus) {
    return null;
  }

  return transformLudusData(rawLudus as unknown as Record<string, unknown>, userId);
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

