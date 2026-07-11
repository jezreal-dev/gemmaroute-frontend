export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="19" stroke="#232A38" strokeWidth="1.5" fill="#0B0E14" />
      {/* entry node */}
      <circle cx="20" cy="8" r="3" fill="#EDF1F5" />
      {/* branch paths */}
      <path d="M20 11 L20 17" stroke="#EDF1F5" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 17 L11 27" stroke="#00D9B4" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 17 L29 27" stroke="#8B7FFF" strokeWidth="2" strokeLinecap="round" />
      {/* local endpoint */}
      <circle cx="11" cy="29" r="3" fill="#00D9B4" />
      {/* cloud endpoint */}
      <circle cx="29" cy="29" r="3" fill="#8B7FFF" />
    </svg>
  );
}

export function Logo({ size = 32, showWordmark = true }: { size?: number; showWordmark?: boolean }) {
  return (
    <div className="flex max-sm:justify-center items-center gap-2.5">
      <LogoIcon size={size} />
      {showWordmark && (
        <span className="font-mono font-semibold" style={{ fontSize: size * 0.6 }}>
          Gemma<span className="text-emerald-400">Route</span>
        </span>
      )}
    </div>
  );
}