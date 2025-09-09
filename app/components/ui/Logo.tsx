export default function Logo() {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-red-600 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
        <div className="relative w-12 h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-full flex items-center justify-center shadow-xl">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
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
