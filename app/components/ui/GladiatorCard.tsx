"use client";

interface GladiatorStats {
  strength: number;
  agility: number;
  endurance: number;
  intelligence: number;
}

interface Gladiator {
  name: string;
  title: string;
  class: string;
  level: number;
  wins: number;
  losses: number;
  skills: string[];
  stats: GladiatorStats;
  image: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface GladiatorCardProps {
  gladiator: Gladiator;
  isSelected: boolean;
  onClick: () => void;
}

export default function GladiatorCard({ gladiator, isSelected, onClick }: GladiatorCardProps) {
  const rarityColors = {
    common: "from-gray-600 to-gray-700",
    rare: "from-blue-600 to-blue-700",
    epic: "from-purple-600 to-purple-700",
    legendary: "from-amber-600 to-amber-700",
  };

  const rarityGlow = {
    common: "shadow-gray-500/20",
    rare: "shadow-blue-500/20",
    epic: "shadow-purple-500/20",
    legendary: "shadow-amber-500/20",
  };

  return (
    <div
      onClick={onClick}
      className={`relative group cursor-pointer transform transition-all duration-300 hover:scale-105 ${
        isSelected ? "scale-105" : ""
      }`}
    >
      {/* Rarity Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r ${rarityColors[gladiator.rarity]} rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300`}
      />
      
      {/* Card */}
      <div
        className={`relative bg-black/60 backdrop-blur-sm border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
          isSelected
            ? `border-amber-500 ${rarityGlow[gladiator.rarity]} shadow-2xl`
            : "border-amber-900/30 hover:border-amber-700/50"
        }`}
      >
        {/* Header with Rarity */}
        <div className={`bg-gradient-to-r ${rarityColors[gladiator.rarity]} p-responsive-3`}>
          <div className="flex items-center justify-between">
            <div className="text-responsive-5xl">{gladiator.image}</div>
            <div className="text-right">
              <div className="text-responsive-xs text-white/80 uppercase tracking-wider">
                {gladiator.rarity}
              </div>
              <div className="text-responsive-xl font-bold text-white">Lvl {gladiator.level}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-responsive-4">
          <h3 className="text-responsive-xl font-bold text-white mb-responsive-1">{gladiator.name}</h3>
          <p className="text-amber-400 text-responsive-sm mb-responsive-2">{gladiator.title}</p>
          <p className="text-gray-400 text-responsive-sm mb-responsive-4">{gladiator.class}</p>

          {/* Stats Bar */}
          <div className="flex justify-between items-center mb-responsive-4 p-responsive-2 bg-black/30 rounded-responsive-lg">
            <div className="text-center">
              <div className="text-green-400 font-bold text-responsive-lg">{gladiator.wins}</div>
              <div className="text-gray-500 text-responsive-xs">Wins</div>
            </div>
            <div className="text-gray-600">|</div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-responsive-lg">{gladiator.losses}</div>
              <div className="text-gray-500 text-responsive-xs">Losses</div>
            </div>
            <div className="text-gray-600">|</div>
            <div className="text-center">
              <div className="text-amber-400 font-bold text-responsive-lg">
                {((gladiator.wins / (gladiator.wins + gladiator.losses)) * 100).toFixed(0)}%
              </div>
              <div className="text-gray-500 text-responsive-xs">Win Rate</div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-responsive-sm">
            {Object.entries(gladiator.stats).slice(0, 2).map(([stat, value]) => (
              <div key={stat} className="flex items-center gap-responsive-sm">
                <div className="text-gray-500 text-responsive-xs capitalize">{stat}:</div>
                <div className="flex-1 h-[clamp(0.25rem,0.5vw,0.5rem)] bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <div className="text-amber-400 text-responsive-xs font-bold">{value}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
