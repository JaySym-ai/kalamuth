import { GameServer } from "@/types/server";

/**
 * Initial server (world) list.
 * For now, we ship one alpha world with default gladiator bounds.
 */

export const SERVERS: GameServer[] = [
  {
    id: "alpha-1",
    name: "Alpha 1", // Will be replaced by translation key
    description: "Early test world for development and balance iteration.", // Will be replaced by translation key
    status: "new",
    paidOnly: false,
    hardcore: true,
    config: {
      gladiatorHealthMin: 30,
      gladiatorHealthMax: 300,
      gladiatorStatMin: 10,
      gladiatorStatMax: 100,
      ludusMaxGladiators: 5,
      initialGladiatorsPerLudus: 3,
      rarityConfig: {
        bad: 5,
        common: 30,
        uncommon: 35,
        rare: 20,
        epic: 8,
        legendary: 1.5,
        unique: 0.5,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "alpha-2",
    name: "Alpha 2", // Will be replaced by translation key
    description: "Safe testing world where gladiators cannot die in combat.", // Will be replaced by translation key
    status: "new",
    paidOnly: false,
    hardcore: false,
    config: {
      gladiatorHealthMin: 30,
      gladiatorHealthMax: 300,
      gladiatorStatMin: 10,
      gladiatorStatMax: 100,
      ludusMaxGladiators: 5,
      initialGladiatorsPerLudus: 3,
      rarityConfig: {
        bad: 5,
        common: 30,
        uncommon: 35,
        rare: 20,
        epic: 8,
        legendary: 1.5,
        unique: 0.5,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "test-server-1",
    name: "Test Server 1", // Will be replaced by translation key
    description: "Restricted testing environment for authorized users only.", // Will be replaced by translation key
    status: "new",
    paidOnly: false,
    hardcore: false,
    testingServer: true,
    config: {
      gladiatorHealthMin: 50,
      gladiatorHealthMax: 500,
      gladiatorStatMin: 20,
      gladiatorStatMax: 200,
      ludusMaxGladiators: 10,
      initialGladiatorsPerLudus: 1,
      rarityConfig: {
        bad: 5,
        common: 30,
        uncommon: 35,
        rare: 20,
        epic: 8,
        legendary: 1.5,
        unique: 0.5,
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Convenience accessor for a default/primary server id.
 * This may be used in early development until a proper server picker exists.
 */
export const DEFAULT_SERVER_ID = "alpha-1";

