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
  {
    id: "portus_nymphae",
    name: "Portus Nymphae",
    description: "Harbor ringed by singing stones that hum when storms gather.",
    historicEvent: "After the Black Squall sank half the fleet, divers found the stones resonated with the wind. Pilots now 'listen' the channel, steering by song when sight fails.",
    inhabitants: 75000,
  },
  {
    id: "solaria",
    name: "Solaria",
    description: "Sun-baked plateau city whose mirrored towers guide caravans from leagues away.",
    historicEvent: "Solaria's mirrors once blinded an advancing host at high noon, turning battle into rout. The same craft now lights clinics and bathhouses after dusk, a kindness remembered by travelers.",
    inhabitants: 68000,
  },
  {
    id: "sableport",
    name: "Sableport",
    description: "Shadowed docks beneath basalt cliffs, famed for dyed sails and quiet deals.",
    historicEvent: "A smuggler-queen once blockaded Sableport with stolen tax ships, demanding amnesty for her crew. The amnesty was granted—and those sailors became the city's first harbor wardens.",
    inhabitants: 52000,
  },
  {
    id: "orontis",
    name: "Orontis",
    description: "Perfumed oasis city where date palms mirror the sky in jeweled pools.",
    historicEvent: "When wells ran bitter, Orontis mapped forgotten cisterns beneath collapsed villas. The 'Night Dig' saved the city and revealed murals that now draw pilgrims and poets alike.",
    inhabitants: 46000,
  },
  {
    id: "valdria",
    name: "Valdria",
    description: "Lowland hub of horse markets and river fords, forever smelling of leather and rain.",
    historicEvent: "When riders brought news of famine, Valdria tithed its herds without waiting for decree. The relief caravans became legend, and the city earned the title 'Bread-Bridle'.",
    inhabitants: 62000,
  },
  {
    id: "vindicar",
    name: "Vindicar",
    description: "Frontier redoubt turned bustling entrepôt at the edge of the steppe.",
    historicEvent: "Originally a chain of watchtowers, Vindicar united under a single banner after repelling a nomad raid with clever beacon signals. Merchants soon followed the safety of its lights.",
    inhabitants: 57000,
  },
];