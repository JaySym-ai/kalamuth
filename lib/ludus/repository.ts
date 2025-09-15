import "server-only";

import { adminDb } from "@/lib/firebase/server";
import { LudusZ, type LudusFromZod } from "@/lib/ludus/schema";
import type { Ludus } from "@/types/ludus";
import { DEFAULT_SERVER_ID, SERVERS } from "@/data/servers";
import { generateGladiators } from "@/lib/gladiator/generator";

const COLLECTION = "ludi"; // plural of ludus

function nowIso() {
  return new Date().toISOString();
}

function getLudusMaxGladiators(serverId: string): number {
  const s = SERVERS.find((s) => s.id === serverId) ?? SERVERS.find((s) => s.id === DEFAULT_SERVER_ID);
  return s?.config.ludusMaxGladiators ?? 5;
}

function getInitialGladiatorsPerLudus(serverId: string): number {
  const s = SERVERS.find((s) => s.id === serverId) ?? SERVERS.find((s) => s.id === DEFAULT_SERVER_ID);
  return s?.config.initialGladiatorsPerLudus ?? 0;
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

export async function listLudiByUser(userId: string, opts?: { serverId?: string }) {
  let q = adminDb().collection(COLLECTION).where("userId", "==", userId);
  if (opts?.serverId) q = q.where("serverId", "==", opts.serverId);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Ludus, "id">) }));
}

export async function getUserLudusOnServer(userId: string, serverId: string) {
  const snap = await adminDb()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("serverId", "==", serverId)
    .limit(1)
    .get();
  const doc = snap.docs[0];
  return doc ? ({ id: doc.id, ...(doc.data() as Omit<Ludus, "id">) } as Ludus) : null;
}

export async function createLudus(input: Partial<Ludus> & { userId: string; serverId: string; name: string; logoUrl: string }) {
  // Enforce single ludus per user per server
  const existing = await getUserLudusOnServer(input.userId, input.serverId);
  if (existing) return existing;

  const data = withDefaults(input);
  const ref = await adminDb().collection(COLLECTION).add(data);
  const created = { id: ref.id, ...data } as Ludus;

  // Seed initial gladiators based on server config
  try {
    const initialCount = Math.min(getInitialGladiatorsPerLudus(created.serverId), created.maxGladiators);
    if (initialCount > 0) {
      const gladiators = await generateGladiators(initialCount);
      const col = adminDb().collection(COLLECTION).doc(created.id!).collection("gladiators");
      for (const g of gladiators) {
        await col.add({
          ...g,
          userId: created.userId,
          serverId: created.serverId,
          ludusId: created.id,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
      }
      await adminDb().collection(COLLECTION).doc(created.id!).set({ gladiatorCount: initialCount, updatedAt: nowIso() }, { merge: true });
      created.gladiatorCount = initialCount;
      created.updatedAt = nowIso();
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.error("[ludi] failed to seed initial gladiators", err);
  }

  return created;
}

export async function updateLudus(id: string, patch: Partial<Ludus>) {
  const updates = { ...patch, updatedAt: nowIso() };
  await adminDb().collection(COLLECTION).doc(id).set(updates, { merge: true });
  const doc = await adminDb().collection(COLLECTION).doc(id).get();
  return { id: doc.id, ...(doc.data() as Omit<Ludus, "id">) } as Ludus;
}

export async function softDeleteLudus(id: string) {
  await adminDb().collection(COLLECTION).doc(id).set({ isDeleted: true, updatedAt: nowIso() }, { merge: true });
}

