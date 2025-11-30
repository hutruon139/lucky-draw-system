import React, { useEffect } from "react";
import Reel from "./Reel";
import { formatTicket } from "../logic/spin";

const STOP_STAGGER = 300; // ms between reels (smooth 1-by-1 stopping)
const STOP_DURATION = 800; // ms, matches Reel transition
const COAST_DURATION = 600;

export default function SlotMachine({
  winningNumber = "000",
  isSpinning,
  onSettled,
}) {
  const formatted = winningNumber ? formatTicket(winningNumber) : "000";
  const digits = formatted.slice(-3).split("").slice(0, 3);
  const stopDelays = [
    0,
    STOP_STAGGER + Math.random() * 120, // Reel 2 stops ~700–820ms later
    STOP_STAGGER * 2 + Math.random() * 180, // Reel 3 stops ~1400–1580ms later
  ];

  useEffect(() => {
    if (isSpinning) return undefined;
    if (!onSettled) return undefined;
    const total =
      COAST_DURATION + STOP_DURATION + stopDelays[stopDelays.length - 1] + 200;
    const timer = setTimeout(() => {
      onSettled();
    }, total);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, digits.join("")]);

  return (
    <div className="relative flex items-center justify-center rounded-[36px] bg-gradient-to-b from-slate-900/60 via-slate-800/80 to-slate-900/70 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-x-4 top-3 h-[6px] rounded-full bg-gradient-to-r from-white/30 via-white/70 to-white/30 blur-sm" />
      <div className="absolute inset-x-6 bottom-3 h-[10px] rounded-full bg-black/30 blur-md" />
      <div
        className="
    relative 
    flex flex-nowrap gap-3
    rounded-[28px] border border-amber-100/50 
    bg-gradient-to-b from-amber-50/70 via-white/70 to-amber-50/70 
    px-6 py-6 
    shadow-[inset_0_2px_6px_rgba(255,255,255,0.6),inset_0_-8px_18px_rgba(0,0,0,0.25)]
  "
      >
        {digits.map((digit, idx) => (
          <Reel
            key={`${digit}-${idx}`}
            targetDigit={parseInt(digit, 10) || 0}
            spinning={isSpinning}
            delay={stopDelays[idx]}
          />
        ))}
      </div>
    </div>
  );
}
