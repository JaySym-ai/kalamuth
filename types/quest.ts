/**
 * Quest domain model for the Ludus management game.
 * Quests are missions that gladiators can undertake for rewards and risks.
 */

export enum QuestStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface Quest {
  // Identity
  id: string;
  
  // Ownership and context
  userId: string;
  ludusId: string;
  serverId?: string;
  
  // Quest assignment
  gladiatorId?: string;
  
  // Quest narrative and details
  title: string;
  description: string;
  volunteerMessage?: string;
  
  // Rewards and risks
  reward: number; // 1-5 sestertii
  dangerPercentage: number; // 0-99% risk of injury
  sicknessPercentage: number; // 0-99% risk of sickness
  deathPercentage: number; // 0-99% risk of death
  
  // Status tracking
  status: QuestStatus;
  startedAt?: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  
  // Results
  result?: string; // Narrative of what happened
  healthLost?: number;
  sicknessContracted?: string;
  injuryContracted?: string;
  questFailed?: boolean;
  gladiatorDied?: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface QuestGenerationContext {
  ludusName: string;
  ludusReputation: number;
  ludusLocation?: string;
  gladiators: Array<{
    id: string;
    name: string;
    surname: string;
    personality: string;
    stats: Record<string, string>;
    health: number;
    currentHealth: number;
    injury?: string;
    sickness?: string;
  }>;
}

export interface GeneratedQuest {
  title: string;
  description: string;
  reward: number;
  dangerPercentage: number;
  sicknessPercentage: number;
  deathPercentage: number;
}

export interface VolunteerInfo {
  gladiatorId: string;
  volunteerMessage: string;
}

export interface QuestResult {
  result: string;
  healthLost: number;
  sicknessContracted?: string;
  injuryContracted?: string;
  questFailed: boolean;
  gladiatorDied: boolean;
}

