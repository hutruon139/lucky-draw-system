import React, { useEffect, useLayoutEffect, useRef } from "react";
import { ACCELERATION_MS, spinDistance, stoppingPlan, stoppingPosition } from "../logic/reelMotion.js";

const DIGITS = Array.from({ length: 20 }, (_, i) => i % 10);
export default function Reel({ targetDigit = 0, spinning, index = 0, onSettled }) {
  const stripRef = useRef(null);
  const command = useRef({ spinning, targetDigit });
  const callback = useRef(onSettled);
  const wake = useRef(null);
  command.current = { spinning, targetDigit };
  callback.current = onSettled;

  useLayoutEffect(() => {
    const node = stripRef.current;
    let frame = null, running = false, position = 0, startPosition = 0;
    let started = null, stop = null, stopStarted = 0;
    let height = node.firstElementChild.offsetHeight;
    const paint = () => {
      const wrapped = ((position % 10) + 10) % 10;
      node.style.transform = `translate3d(0, ${-wrapped * height}px, 0)`;
    };
    const resize = new ResizeObserver(() => {
      height = node.firstElementChild.offsetHeight;
      paint();
    });
    resize.observe(node.firstElementChild);
    const tick = now => {
      frame = null;
      if (!running) return;
      if (!stop) {
        const distance = spinDistance(now - started);
        position = startPosition + distance;
        // Finish accelerating even when Stop is pressed immediately.
        if (!command.current.spinning && now - started >= ACCELERATION_MS) {
          stop = stoppingPlan(position, command.current.targetDigit, 2200 + index * 350);
          stopStarted = now;
        }
      } else {
        position = stoppingPosition(stop, now - stopStarted);
        if (now - stopStarted >= stop.duration) {
          position = stop.end;
          paint();
          node.style.willChange = "auto";
          running = false;
          callback.current?.(index);
          return;
        }
      }
      paint();
      frame = requestAnimationFrame(tick);
    };
    wake.current = () => {
      // Arm synchronously: Stop can be pressed before the first animation frame.
      if (command.current.spinning && !running) {
        running = true;
        started = performance.now();
        startPosition = position;
        stop = null;
        node.style.willChange = "transform";
      }
      if (frame === null && (command.current.spinning || running))
        frame = requestAnimationFrame(tick);
    };
    paint();
    wake.current();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resize.disconnect();
      wake.current = null;
    };
  }, [index]);

  useEffect(() => { wake.current?.(); }, [spinning]);

  return (
    <div
      className="reel-window border-[8px] border-[#86d3cc] h-[290px] xl:h-[400px] w-[200px] xl:w-[250px] relative overflow-hidden rounded-[18px] bg-gradient-to-b from-white to-slate-100 shadow-[inset_0_6px_12px_rgba(255,255,255,0.6),inset_0_-10px_16px_rgba(0,0,0,0.18)] "

    >
      <div ref={stripRef} className="reel-strip font-[ReelDisplayA]">
        {DIGITS.map((d, idx) => (
          <div
            key={`${d}-${idx}`}
            className="
  reel-item h-[270px] xl:h-[400px]
  flex items-center justify-center
  text-[153px] xl:text-[280px] font-black leading-none
  text-transparent bg-clip-text
  bg-[linear-gradient(to_bottom,#f0d4a1,#c69c6b)]
  drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]
"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/55 via-transparent to-slate-900/10" />
    </div>
  );
}
