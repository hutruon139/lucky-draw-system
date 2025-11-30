import React, { useEffect, useRef } from "react";

const ITEM_HEIGHT = 80; // px per digit
const REPEAT = 6; // build a longer strip for smooth looping
const DIGITS = Array.from({ length: REPEAT * 10 }, (_, i) => i % 10);

export default function Reel({ targetDigit = 0, spinning, delay = 0 }) {
  const stripRef = useRef(null);
  const tickTimerRef = useRef(null);

  useEffect(() => {
    const node = stripRef.current;
    if (!node) return undefined;

    const clearTick = () => {
      if (tickTimerRef.current) {
        clearTimeout(tickTimerRef.current);
        tickTimerRef.current = null;
      }
    };

    const startSpin = () => {
      clearTick();
      node.style.transition = "none";
      node.style.animation = "";
      node.style.transform = "";
      node.classList.add("reel-spin");
    };

    const stopSpin = () => {
      clearTick();

      // Freeze at current animation position
      const cs = getComputedStyle(node);
      const matrix = new DOMMatrixReadOnly(cs.transform);
      const offsetY = matrix.m42;
      node.classList.remove("reel-spin");
      node.style.animation = "none";
      node.style.transition = "none";
      node.style.transform = `translateY(${offsetY}px)`;

      // Calculate current working index (not normalized to strip length)
      let workingIndex = Math.round(-offsetY / ITEM_HEIGHT);
      const currentDigit = ((workingIndex % 10) + 10) % 10;
      const target = targetDigit % 10;

      // Forward-only steps; add a couple loops for smoother stop
      let stepsRemaining = target - currentDigit;
      if (stepsRemaining < 0) stepsRemaining += 10;
      const extraLoops = 2; // full loops before landing
      stepsRemaining += extraLoops * 10;

      const totalSteps = stepsRemaining;
      let stepDelay = 60; // start speed
      let slowStep = 8;
      const maxDelay = 320;

      const tick = () => {
        if (stepsRemaining <= 0) {
          const targetIndex = workingIndex;
          const displayIndex =
            ((targetIndex % DIGITS.length) + DIGITS.length) % DIGITS.length;
          node.style.transition = "transform 380ms cubic-bezier(0.22,1,0.36,1)";
          node.style.transform = `translateY(${-displayIndex * ITEM_HEIGHT}px)`;
          return;
        }

        workingIndex += 1;
        stepsRemaining -= 1;

        const displayIndex =
          ((workingIndex % DIGITS.length) + DIGITS.length) % DIGITS.length;
        const offset = -displayIndex * ITEM_HEIGHT;

        node.style.transition = `transform ${stepDelay}ms linear`;
        node.style.transform = `translateY(${offset}px)`;

        stepDelay = Math.min(stepDelay + slowStep, maxDelay);
        if (stepDelay > 140) slowStep = 14;
        if (stepDelay > 240) slowStep = 20;

        tickTimerRef.current = setTimeout(tick, stepDelay);
      };

      tickTimerRef.current = setTimeout(tick, delay);
    };

    if (spinning) {
      startSpin();
    } else {
      stopSpin();
    }

    return clearTick;
  }, [spinning, targetDigit, delay]);

  return (
    <div
      className="reel-window relative overflow-hidden rounded-[18px] bg-gradient-to-b from-white to-slate-100 shadow-[inset_0_6px_12px_rgba(255,255,255,0.6),inset_0_-10px_16px_rgba(0,0,0,0.18)]"
      style={{
        height: ITEM_HEIGHT,
        width: 96,
        "--reel-item-height": `${ITEM_HEIGHT}px`,
        "--reel-strip-length": DIGITS.length,
      }}
    >
      <div ref={stripRef} className="reel-strip">
        {DIGITS.map((d, idx) => (
          <div
            key={`${d}-${idx}`}
            className="reel-item flex items-center justify-center text-5xl font-black text-amber-500"
            style={{ height: ITEM_HEIGHT }}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/55 via-transparent to-slate-900/10" />
    </div>
  );
}
