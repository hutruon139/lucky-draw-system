import React, { useEffect, useRef, useState } from "react";
import { formatTicket, getRandomTicketNumber } from "../logic/spin";

export default function RollingCounter({
  isSpinning,
  frozenNumber,
  onSettled,
}) {
  const [displayNumber, setDisplayNumber] = useState("000");
  const spinIntervalRef = useRef(null);
  const digitTimersRef = useRef([]);

  // Spin continuously while running with random jumps
  useEffect(() => {
    if (!isSpinning) return undefined;
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    if (digitTimersRef.current.length) {
      digitTimersRef.current.forEach(clearInterval);
      digitTimersRef.current = [];
    }
    spinIntervalRef.current = setInterval(() => {
      // randomize each digit to keep the reel feeling lively
      const rand = getRandomTicketNumber();
      setDisplayNumber(rand);
    }, 55);
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, [isSpinning]);

  // Smoothly ease to the winning number when stop is triggered
  useEffect(() => {
    if (isSpinning || !frozenNumber) return undefined;
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    if (digitTimersRef.current.length) {
      digitTimersRef.current.forEach(clearInterval);
      digitTimersRef.current = [];
    }

    const target = formatTicket(frozenNumber).split("");
    const current = formatTicket(displayNumber).split("");
    let completed = 0;

    const timers = target.map((digit, idx) => {
      const startDigit = parseInt(current[idx], 10) || 0;
      const targetDigit = parseInt(digit, 10);
      const minCycles = idx === 0 ? 6 : 4; // more cycles for first digit, dramatic
      const minSteps = 10 * minCycles;
      let stepCount = 0;
      let currentDigit = startDigit;

      const interval = setInterval(() => {
        stepCount += 1;
        // First digit only cycles 0-2 since max ticket is 200
        const modulus = idx === 0 ? 3 : 10;
        currentDigit = (currentDigit + 1) % modulus;
        current[idx] = String(currentDigit);
        setDisplayNumber(current.join(""));

        const reachedTarget =
          currentDigit === targetDigit && stepCount >= minSteps;
        if (reachedTarget) {
          clearInterval(interval);
          completed += 1;
          if (completed === target.length) {
            digitTimersRef.current = [];
            setDisplayNumber(target.join(""));
            if (onSettled) onSettled();
          }
        }
      }, 70 + idx * 30); // staggered per digit
      return interval;
    });

    digitTimersRef.current = timers;

    return () => {
      timers.forEach(clearInterval);
      digitTimersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, frozenNumber]);

  return (
    <div className="relative flex items-center justify-center rounded-[32px] bg-gradient-to-b from-cyan-200/90 via-cyan-100 to-cyan-200/80 p-3 shadow-2xl shadow-cyan-900/40">
      <div className="grid grid-cols-3 gap-3 rounded-[24px] bg-cyan-50/80 px-6 py-6">
        {displayNumber.split("").map((digit, idx) => (
          <div
            key={`${digit}-${idx}`}
            className="flex h-24 w-20 items-center justify-center rounded-[18px] bg-white/90 text-5xl font-extrabold tracking-widest text-amber-500 shadow-inner shadow-cyan-900/10"
          >
            <span className="tabular-nums">{digit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
