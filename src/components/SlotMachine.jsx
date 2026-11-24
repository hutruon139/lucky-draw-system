import React, { useCallback, useEffect, useRef } from "react";
import Reel from "./Reel";
import { formatTicket } from "../logic/spin";
export default function SlotMachine({ winningNumber = "000", isSpinning, onSettled }) {
  const done = useRef(new Set());
  const active = useRef(false);
  const callback = useRef(onSettled);
  callback.current = onSettled;
  useEffect(() => {
    if (isSpinning) { done.current.clear(); active.current = true; }
  }, [isSpinning]);
  const settled = useCallback(index => {
    if (!active.current) return;
    done.current.add(index);
    if (done.current.size === 3) {
      active.current = false;
      callback.current?.();
    }
  }, []);
  const digits = formatTicket(winningNumber).slice(-3).split("");
  return (
    <div className="relative flex items-center justify-center">
      <div className="flex flex-nowrap gap-3 rounded-[28px] px-6 pt-20">
        {digits.map((digit, idx) => <Reel key={idx} targetDigit={Number(digit)}
          spinning={isSpinning} index={idx} onSettled={settled} />)}
      </div>
    </div>
  );
}
