import React, { useEffect, useLayoutEffect, useRef } from "react";
import { ACCELERATION_MS, spinDistance, stoppingPlan, stoppingPosition } from "../logic/reelMotion.js";

const DIGITS = Array.from({ length: 20 }, (_, i) => i % 10);
// Vertical motion blur in design px per (px/ms) of reel speed, capped so digits stay readable as streaks.
const BLUR_PER_SPEED = 3.5;
const MAX_BLUR = 16;
export default function Reel({ targetDigit = 0, spinning, index = 0, left, onSettled }) {
  const stripRef = useRef(null);
  const windowRef = useRef(null);
  const blurRef = useRef(null);
  const command = useRef({ spinning, targetDigit });
  const callback = useRef(onSettled);
  const wake = useRef(null);
  command.current = { spinning, targetDigit };
  callback.current = onSettled;
  const filterId = `reel-blur-${index}`;

  useLayoutEffect(() => {
    const node = stripRef.current;
    // Offset each reel so the two digits never spin in lockstep.
    let frame = null, running = false, position = index * 5, startPosition = 0;
    let started = null, stop = null, stopStarted = 0;
    let lastPosition = position, lastTime = 0, blur = 0;
    let height = node.firstElementChild.offsetHeight;
    const paint = () => {
      const wrapped = ((position % 10) + 10) % 10;
      node.style.transform = `translate3d(0, ${-wrapped * height}px, 0)`;
    };
    const setBlur = value => {
      const next = Math.round(value * 2) / 2;
      if (next === blur) return;
      blur = next;
      blurRef.current.setAttribute("stdDeviation", `0 ${blur}`);
      windowRef.current.style.filter = blur ? `url(#${filterId})` : "none";
    };
    const resize = new ResizeObserver(() => {
      height = node.firstElementChild.offsetHeight;
      paint();
    });
    resize.observe(node.firstElementChild);
    blurRef.current.setAttribute("stdDeviation", "0 0");
    windowRef.current.style.filter = "none";
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
          setBlur(0);
          node.style.willChange = "auto";
          running = false;
          callback.current?.(index);
          return;
        }
      }
      setBlur(Math.min(MAX_BLUR, BLUR_PER_SPEED * Math.abs(position - lastPosition) * height / Math.max(1, now - lastTime)));
      lastPosition = position;
      lastTime = now;
      paint();
      frame = requestAnimationFrame(tick);
    };
    wake.current = () => {
      // Arm synchronously: Stop can be pressed before the first animation frame.
      if (command.current.spinning && !running) {
        running = true;
        started = performance.now();
        startPosition = lastPosition = position;
        lastTime = started;
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
  }, [index, filterId]);

  useEffect(() => { wake.current?.(); }, [spinning]);

  return <>
    <svg className="reel-filter" aria-hidden="true">
      <filter id={filterId} x="0" y="-20%" width="100%" height="140%" colorInterpolationFilters="sRGB">
        <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
      </filter>
    </svg>
    <div ref={windowRef} className="reel-window" style={{ left }}>
      <div ref={stripRef} className="reel-strip">
        {DIGITS.map((d, idx) => <div key={`${d}-${idx}`} className="reel-item digit">{d}</div>)}
      </div>
    </div>
  </>;
}
