import { City } from "@/types/city";

/**
 * Generated list of 12 distinct cities for the Kalamuth world.
 * Each city has an ID for translation lookup
 * Velusia and Halicara have arenas
 */
export const CITIES: City[] = [
  {
    id: "velusia",
    name: "Velusia", // Has arena - must keep
    description: "A marble-clad capital famed for its amphitheaters and meticulous roadways.",
    historicEvent: "Velusia ended the Three Banners War by hosting the Concord of Spears, a parley that lasted seven days. When talks collapsed, a lone champion settled the dispute in ritual combat, a tradition still honored in the arena.",
    inhabitants: 180000,
  },
  {
    id: "halicara",
    name: "Halicara", // Has arena - must keep
    description: "Harsh citadel guarding a mountain pass dusted in year-round frost.",
    historicEvent: "Bandit kings besieged Halicara until an avalanche cut their lines at dawn. The city carved warning horns from the frozen drifts; they've not been silent since.",
    inhabitants: 27000,
  },
  {
    id: "thalassar",
    name: "Thalassar",
    description: "Wind-bent port on a cobalt bay, its lighthouses patterned with sea-glass mosaics.",
    historicEvent: "Thalassar repelled the Moon Pirate armada with fire ships hidden among fishing craft. The victory feast lasted three tides and birthed the Guild of Mariners, now the city's quiet rulers.",
    inhabitants: 122000,
  },
  {
    id: "dorosia",
    name: "Dorosia",
    description: "Market crossroads where ten tongues mingle and no coin is refused.",
    historicEvent: "Dorosia codified the first Merchant's Peace, forbidding bloodshed within sight of its granite obelisks. A duel that defied the law left twin scars on the stones, now rubbed for luck by travelers.",
    inhabitants: 83000,
  },
  {
    id: "arx_ferrum",
    name: "Arx Ferrum",
    description: "Smoky citadel of ironmongers, its streets dusted in red ore.",
    historicEvent: "When the Great Quake shattered nearby mines, Arx Ferrum forged rescue cages fast enough to save hundreds. The guild's oath—steel serves life before war—has held for three generations.",
    inhabitants: 56000,
  },
  {
    id: "neropolis",
    name: "Neropolis",
    description: "Canal-woven city of lanterns that burn blue with marsh gas at dusk.",
    historicEvent: "A plague once stalked Neropolis until a healer mapped the wind and water like veins. Her canal gates still 'breathe' with the tides, flushing sickness from the city every night.",
    inhabitants: 99000,
  },
];