import {
  GLADIATOR_HEALTH_MAX,
  GLADIATOR_HEALTH_MIN,
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

function coerceString(value: unknown, fallback: string, locale?: string) {
  // Check if it's a bilingual object
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (locale && (locale === "fr" || locale === "en") && typeof obj[locale] === "string") {
      const localized = obj[locale] as string;
      return localized.trim().length > 0 ? localized.trim() : fallback;
    }
    // Fallback to English if available
    if (typeof obj.en === "string") {
      const en = obj.en as string;
      return en.trim().length > 0 ? en.trim() : fallback;
    }
  }
  // Handle regular string
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

function coerceOptionalString(value: unknown, locale?: string) {
  // Check if it's a bilingual object
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (locale && (locale === "fr" || locale === "en") && typeof obj[locale] === "string") {
      const localized = obj[locale] as string;
      const trimmed = localized.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    // Fallback to English if available
    if (typeof obj.en === "string") {
      const en = obj.en as string;
      const trimmed = en.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
  }
  // Handle regular string
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

function buildStats(candidate: unknown, fallback: Record<string, unknown>, locale?: string): GladiatorStats {
  const source = (candidate && typeof candidate === "object" ? candidate : {}) as Record<string, unknown>;

  const stats = Object.fromEntries(
    STAT_KEYS.map((key) => {
      const chosen = source[key] ?? fallback[key];
      return [key, coerceString(chosen, "—", locale)];
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

export function normalizeGladiator(id: string, data: Record<string, unknown>, locale?: string): NormalizedGladiator {
  const statsCandidate = (data as { stats?: unknown }).stats;
  const stats = buildStats(statsCandidate, data, locale);

  const gladiator: NormalizedGladiator = {
    id,
    name: coerceString(data.name, "—", locale),
    surname: coerceString(data.surname, "—", locale),
    avatarUrl: coerceString(data.avatarUrl, "https://placehold.co/256x256?text=Gladiator", locale),
    health: coerceNumber(data.health, {
      min: GLADIATOR_HEALTH_MIN,
      max: GLADIATOR_HEALTH_MAX,
      fallback: GLADIATOR_HEALTH_MIN,
    }),
    alive: typeof data.alive === "boolean" ? data.alive : true,
    stats,
    lifeGoal: coerceString(data.lifeGoal, "—", locale),
    personality: coerceString(data.personality, "—", locale),
    backstory: coerceString(data.backstory, "—", locale),
    weakness: coerceString(data.weakness, "—", locale),
    fear: coerceString(data.fear, "—", locale),
    likes: coerceString(data.likes, "—", locale),
    dislikes: coerceString(data.dislikes, "—", locale),
    birthCity: coerceString(data.birthCity, "—", locale),
    physicalCondition: coerceString(data.physicalCondition, "—", locale),
    notableHistory: coerceString(data.notableHistory, "—", locale),
    injury: coerceOptionalString(data.injury, locale),
    injuryTimeLeftHours:
      typeof data.injuryTimeLeftHours === "number"
        ? Math.max(1, Math.round(data.injuryTimeLeftHours))
        : typeof data.injuryTimeLeftHours === "string"
        ? Math.max(1, Math.round(Number.parseInt(data.injuryTimeLeftHours, 10) || 0)) || undefined
        : undefined,
    sickness: coerceOptionalString(data.sickness, locale),
    handicap: coerceOptionalString(data.handicap, locale),
    uniquePower: coerceOptionalString(data.uniquePower, locale),
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

