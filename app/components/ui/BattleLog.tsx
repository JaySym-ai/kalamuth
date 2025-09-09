interface BattleLogProps {
  log: {
    time: string;
    attacker: string;
    action: string;
    damage: number;
    type: string;
  };
  isNew: boolean;
}

export default function BattleLog({ log, isNew }: BattleLogProps) {
  const typeColors = {
    attack: "text-red-400",
    defense: "text-blue-400",
    special: "text-purple-400",
    movement: "text-gray-400",
    counter: "text-orange-400",
    buff: "text-green-400",
    miss: "text-gray-500",
    critical: "text-yellow-400",
  };

  const typeIcons = {
    attack: "⚔️",
    defense: "🛡️",
    special: "✨",
    movement: "👣",
    counter: "🔄",
    buff: "⬆️",
    miss: "❌",
    critical: "💥",
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-500 ${
        isNew
          ? "bg-amber-900/20 border border-amber-700/30 animate-pulse"
          : "bg-black/20 border border-gray-800/30"
      }`}
    >
      <div className="text-gray-500 text-xs font-mono min-w-[40px]">
        {log.time}
      </div>
      
      <div className="text-lg">
        {typeIcons[log.type as keyof typeof typeIcons]}
      </div>
      
      <div className="flex-1">
        <span className="text-amber-400 font-semibold">{log.attacker}</span>
        <span className="text-gray-300 mx-1">{log.action}</span>
        {log.damage > 0 && (
          <span className={`font-bold ${typeColors[log.type as keyof typeof typeColors]}`}>
            -{log.damage} HP
          </span>
        )}
      </div>
    </div>
  );
}
