import type { NormalizedGladiator } from "./normalize";
import type { CombatGladiator } from "@/types/combat";

// Narrowed NormalizedGladiator fields we rely on (avoid 'any')
type NG = NormalizedGladiator & {
  avatarUrl?: string | null;
  rankingPoints?: number;
  userId?: string | null;
  ludusId?: string | null;
  alive?: boolean;
  stats?: {
    strength: string; agility: string; dexterity: string; speed: string;
    chance: string; intelligence: string; charisma: string; loyalty: string;
  };
  injury?: string;
  injuryTimeLeftHours?: number;
  sickness?: string;
  lifeGoal?: string;
  personality?: string;
  backstory?: string;
  weakness?: string;
  fear?: string;
  likes?: string;
  dislikes?: string;
  birthCity?: string;
  handicap?: string;
  uniquePower?: string;
  physicalCondition?: string;
  notableHistory?: string;
};


/**
 * Adapter to convert a NormalizedGladiator (app-wide normalized shape)
 * into the CombatGladiator shape expected by combat UI/engine.
 */
export function toCombatGladiator(gInput: NormalizedGladiator): CombatGladiator {
  const g = gInput as NG;
  const name = (g as { name?: unknown }).name;
  const surname = (g as { surname?: unknown }).surname;
  const health = (g as { health?: unknown }).health;
  const currentHealth = (g as { currentHealth?: unknown }).currentHealth;

  return {
    id: g.id,
    name: String(name ?? "—"),
    surname: String(surname ?? "—"),
    avatarUrl: g.avatarUrl ?? null,
    rankingPoints: Number(g.rankingPoints ?? 1000),
    health: Number(health ?? 100),
    currentHealth: Number(currentHealth ?? health ?? 100),
    userId: g.userId ?? null,
    ludusId: g.ludusId ?? null,
    alive: typeof g.alive === "boolean" ? g.alive : true,
    stats: g.stats ?? {
      strength: "",
      agility: "",
      dexterity: "",
      speed: "",
      chance: "",
      intelligence: "",
      charisma: "",
      loyalty: "",
    },
    injury: g.injury,
    injuryTimeLeftHours: g.injuryTimeLeftHours,
    sickness: g.sickness,
    lifeGoal: String(g.lifeGoal ?? "—"),
    personality: String(g.personality ?? "—"),
    backstory: String(g.backstory ?? "—"),
    weakness: String(g.weakness ?? "—"),
    fear: String(g.fear ?? "—"),
    likes: String(g.likes ?? "—"),
    dislikes: String(g.dislikes ?? "—"),
    birthCity: String(g.birthCity ?? "—"),
    handicap: g.handicap,
    uniquePower: g.uniquePower,
    physicalCondition: String(g.physicalCondition ?? "—"),
    notableHistory: String(g.notableHistory ?? "—"),
  };
}

