import {
  GLADIATOR_HEALTH_MAX,
  GLADIATOR_HEALTH_MIN,
  GLADIATOR_STAT_MAX,
  GLADIATOR_STAT_MIN,
  type Gladiator,
  type GladiatorStats,
} from "@/types/gladiator";

const STAT_KEYS: Array<keyof GladiatorStats> = [
  "strength",
  "agility",
  "dexterity",
  "speed",
  "chance",
  "intelligence",
  "charisma",
  "loyalty",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function coerceNumber(value: unknown, { min, max, fallback }: { min: number; max: number; fallback: number }) {
  const num = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  if (!Number.isFinite(num)) {
    return fallback;
  }
  const rounded = Math.round(num);
  return clamp(rounded, min, max);
}

function coerceString(value: unknown, fallback: string) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function coerceOptionalString(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function buildStats(candidate: unknown, fallback: Record<string, unknown>): GladiatorStats {
  const source = (candidate && typeof candidate === "object" ? candidate : {}) as Record<string, unknown>;

  const stats = Object.fromEntries(
    STAT_KEYS.map((key) => {
      const chosen = source[key] ?? fallback[key];
      return [
        key,
        coerceNumber(chosen, {
          min: GLADIATOR_STAT_MIN,
          max: GLADIATOR_STAT_MAX,
          fallback: GLADIATOR_STAT_MIN,
        }),
      ];
    })
  ) as GladiatorStats;

  return stats;
}

export type NormalizedGladiator = Gladiator & {
  id: string;
  ludusId?: string;
  serverId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export function normalizeGladiator(id: string, data: Record<string, unknown>): NormalizedGladiator {
  const statsCandidate = (data as { stats?: unknown }).stats;
  const stats = buildStats(statsCandidate, data);

  const gladiator: NormalizedGladiator = {
    id,
    name: coerceString(data.name, "—"),
    surname: coerceString(data.surname, "—"),
    avatarUrl: coerceString(data.avatarUrl, "https://placehold.co/256x256?text=Gladiator"),
    health: coerceNumber(data.health, {
      min: GLADIATOR_HEALTH_MIN,
      max: GLADIATOR_HEALTH_MAX,
      fallback: GLADIATOR_HEALTH_MIN,
    }),
    alive: typeof data.alive === "boolean" ? data.alive : true,
    stats,
    lifeGoal: coerceString(data.lifeGoal, "—"),
    personality: coerceString(data.personality, "—"),
    backstory: coerceString(data.backstory, "—"),
    weakness: coerceString(data.weakness, "—"),
    fear: coerceString(data.fear, "—"),
    likes: coerceString(data.likes, "—"),
    dislikes: coerceString(data.dislikes, "—"),
    birthCity: coerceString(data.birthCity, "—"),
    physicalCondition: coerceString(data.physicalCondition, "—"),
    notableHistory: coerceString(data.notableHistory, "—"),
    injury: coerceOptionalString(data.injury),
    injuryTimeLeftHours:
      typeof data.injuryTimeLeftHours === "number"
        ? Math.max(1, Math.round(data.injuryTimeLeftHours))
        : typeof data.injuryTimeLeftHours === "string"
        ? Math.max(1, Math.round(Number.parseInt(data.injuryTimeLeftHours, 10) || 0)) || undefined
        : undefined,
    sickness: coerceOptionalString(data.sickness),
    handicap: coerceOptionalString(data.handicap),
    uniquePower: coerceOptionalString(data.uniquePower),
    ludusId: typeof data.ludusId === "string" ? data.ludusId : undefined,
    serverId:
      data.serverId === null
        ? null
        : typeof data.serverId === "string"
        ? data.serverId
        : undefined,
    createdAt: typeof data.createdAt === "string" ? data.createdAt : undefined,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : undefined,
  };

  return gladiator;
}

