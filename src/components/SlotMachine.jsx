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
    <div className="relative flex items-center justify-center">
      <div
        className="
    relative
    flex flex-nowrap gap-3
    rounded-[28px]
    px-6 py-6
  "
      >
        {digits.map((digit, idx) => (
          <Reel
            key={idx}
            targetDigit={parseInt(digit, 10) || 0}
            spinning={isSpinning}
            delay={stopDelays[idx]}
          />
        ))}
      </div>
    </div>
  );
}
