import { GameServer } from "@/types/server";

/**
 * Initial server (world) list.
 * For now, we ship one alpha world with default gladiator bounds.
 */

export const SERVERS: GameServer[] = [
  {
    id: "alpha-1",
    name: "Alpha 1",
    description: "Early test world for development and balance iteration.",
    status: "new",
    paidOnly: false,
    hardcore: true,
    config: {
      gladiatorHealthMin: 30,
      gladiatorHealthMax: 300,
      gladiatorStatMin: 10,
      gladiatorStatMax: 100,
      ludusSize: 5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "alpha-2",
    name: "Alpha 2",
    description: "Safe testing world where gladiators cannot die in combat.",
    status: "new",
    paidOnly: false,
    hardcore: false,
    config: {
      gladiatorHealthMin: 30,
      gladiatorHealthMax: 300,
      gladiatorStatMin: 10,
      gladiatorStatMax: 100,
      ludusSize: 5,
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

