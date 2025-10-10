interface SectionTitleProps {
  subtitle?: string;
  title: string;
  description?: string;
  centered?: boolean;
}

export default function SectionTitle({
  subtitle,
  title,
  description,
  centered = true,
}: SectionTitleProps) {
  return (
    <div className={`${centered ? "text-center" : ""} max-w-4xl ${centered ? "mx-auto" : ""}`}>
      {subtitle && (
        <div className="inline-flex items-center gap-responsive-sm px-responsive-3 py-responsive-2 bg-amber-900/30 border border-amber-700/50 rounded-responsive-lg mb-responsive-4 backdrop-blur-sm">
          <span className="text-amber-400 text-responsive-sm font-bold tracking-widest">
            {subtitle}
          </span>
        </div>
      )}

      <h2 className="text-responsive-4xl font-black mb-responsive-4">
        <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
          {title}
        </span>
      </h2>

      {description && (
        <p className="text-responsive-lg text-gray-400 leading-responsive-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
