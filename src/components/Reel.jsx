import React, { useEffect, useRef } from "react";

const ITEM_HEIGHT = 80; // px per digit
const REPEAT = 6; // build a longer strip for smooth looping
const DIGITS = Array.from({ length: REPEAT * 10 }, (_, i) => i % 10);

export default function Reel({ targetDigit = 0, spinning, delay = 0 }) {
  const stripRef = useRef(null);
  const tickTimerRef = useRef(null);
  const wasSpinningRef = useRef(false);

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
      // Only reset transform if we're not already spinning (avoid resetting mid-spin)
      if (!wasSpinningRef.current) {
        node.style.transition = "none";
        node.style.animation = "";
        node.style.transform = "";
      }
      node.classList.add("reel-spin");
      wasSpinningRef.current = true;
    };

    const stopSpin = () => {
      clearTick();

      // Use double requestAnimationFrame to ensure we read position after browser paints
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Read position while animation is still active (BEFORE removing the class)
          const cs = getComputedStyle(node);
          let offsetY = 0;

          // Try to get transform from computed style
          if (cs.transform && cs.transform !== "none") {
            try {
              const matrix = new DOMMatrixReadOnly(cs.transform);
              offsetY = matrix.m42;
            } catch (e) {
              // Fallback: parse from transform string
              const match = cs.transform.match(/translateY\(([^)]+)\)/);
              if (match) {
                offsetY = parseFloat(match[1]) || 0;
              }
            }
          }

          // If we still don't have a valid offset, check if we have an inline style
          if (offsetY === 0 && node.style.transform) {
            const match = node.style.transform.match(/translateY\(([^)]+)\)/);
            if (match) {
              offsetY = parseFloat(match[1]) || 0;
            }
          }

          // Now remove animation and freeze position (AFTER reading)
          node.classList.remove("reel-spin");
          node.style.animation = "none";
          node.style.transition = "none";

          // If offsetY is still 0, we're likely at the start or there's an issue
          // In this case, estimate a position based on animation progress
          // But first, let's ensure we preserve any existing transform
          if (offsetY === 0) {
            // Check if the strip has moved visually by comparing with initial position
            // For now, use a safe default that won't cause a visible jump
            // We'll start from somewhere in the middle of the strip
            const safeStart = Math.floor(DIGITS.length / 3) * ITEM_HEIGHT;
            offsetY = -safeStart;
          }

          // Apply the frozen position
          node.style.transform = `translateY(${offsetY}px)`;

          // Calculate current working index (not normalized to strip length)
          let workingIndex = Math.round(-offsetY / ITEM_HEIGHT);
          // Normalize to positive range
          while (workingIndex < 0) {
            workingIndex += DIGITS.length;
          }
          workingIndex = workingIndex % DIGITS.length;

          const currentDigit = ((workingIndex % 10) + 10) % 10;
          const target = targetDigit % 10;

          // Forward-only steps; add a couple loops for smoother stop
          let stepsRemaining = target - currentDigit;
          if (stepsRemaining < 0) stepsRemaining += 10;
          const extraLoops = 2; // full loops before landing
          stepsRemaining += extraLoops * 10;

          let stepDelay = 60; // start speed
          let slowStep = 8;
          const maxDelay = 320;

          const tick = () => {
            if (stepsRemaining <= 0) {
              const targetIndex = workingIndex;
              const displayIndex =
                ((targetIndex % DIGITS.length) + DIGITS.length) % DIGITS.length;
              node.style.transition =
                "transform 380ms cubic-bezier(0.22,1,0.36,1)";
              node.style.transform = `translateY(${
                -displayIndex * ITEM_HEIGHT
              }px)`;
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
        });
      });
    };

    if (spinning) {
      startSpin();
    } else {
      wasSpinningRef.current = false;
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
