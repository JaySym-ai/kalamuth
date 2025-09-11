export default function Logo() {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-red-600 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
        <img
          src="/icons/icon.svg"
          alt="Kalamuth logo"
          className="relative w-12 h-12 rounded-xl shadow-xl"
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
          KALAMUTH
        </h1>
        <p className="text-xs text-gray-400 tracking-widest">LUDUS MAGNUS</p>
      </div>
    </div>
  );
}
