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
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-700/50 rounded-full mb-4 backdrop-blur-sm">
          <span className="text-amber-400 text-sm font-bold tracking-widest">
            {subtitle}
          </span>
        </div>
      )}
      
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
        <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
          {title}
        </span>
      </h2>
      
      {description && (
        <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
