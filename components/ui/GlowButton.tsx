interface GlowButtonProps {
  children: React.ReactNode;
  primary?: boolean;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
}

export default function GlowButton({
  children,
  primary = false,
  size = "medium",
  onClick,
}: GlowButtonProps) {
  const sizeClasses = {
    small: "px-responsive-3 py-responsive-1 text-responsive-sm tap-target-sm",
    medium: "px-responsive-4 py-responsive-2 text-responsive-base tap-target-base",
    large: "px-responsive-6 py-responsive-3 text-responsive-lg tap-target-lg",
  };

  const baseClasses = `
    relative font-bold rounded-responsive-lg transition-all duration-300
    transform hover:scale-105 active:scale-95
    shadow-2xl overflow-hidden group flex items-center justify-center
  `;

  const primaryClasses = primary
    ? "bg-gradient-to-r from-amber-600 to-red-600 text-white hover:from-amber-500 hover:to-red-500 hover:shadow-amber-500/50"
    : "bg-black/50 backdrop-blur-sm border border-amber-700/50 text-amber-400 hover:bg-amber-900/30 hover:border-amber-600 hover:shadow-amber-600/30";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${primaryClasses} ${sizeClasses[size]}`}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 to-red-400/20 blur-xl" />
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <span className="relative z-10">{children}</span>
    </button>
  );
}
