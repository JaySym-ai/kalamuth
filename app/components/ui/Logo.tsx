import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex items-center gap-responsive-6 group cursor-pointer">
      <div className="relative w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)]">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-red-600 rounded-responsive-lg blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
        <Image
          src="/icons/icon.svg"
          alt="Kalamuth logo"
          width={48}
          height={48}
          className="relative w-[clamp(2.5rem,6vw,3rem)] h-[clamp(2.5rem,6vw,3rem)] rounded-responsive-lg shadow-xl"
          priority
        />
      </div>
      <div className="pl-2">
        <h1 className="text-responsive-2xl font-bold bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">
          KALAMUTH
        </h1>
        <p className="text-responsive-xs text-gray-400 tracking-widest">LUDUS MAGNUS</p>
      </div>
    </div>
  );
}
