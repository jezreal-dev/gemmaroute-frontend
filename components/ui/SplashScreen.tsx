"use client";

import { useEffect, useState } from "react";
import { LogoIcon } from "./Logo";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1200);
    const doneTimer = setTimeout(onDone, 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-600 px-4 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <LogoIcon size={64} />
      <div className="mt-4 font-mono font-semibold text-xl sm:text-2xl text-zinc-100 text-center">
         Gemma<span className="text-emerald-400">Route</span>
      </div>
      <div className="mt-2 text-[10px] sm:text-[11px] font-mono tracking-[2px] text-zinc-500 text-center">
        AMD AI HACKATHON · TRACK 3
      </div>
    </div>
  );
}