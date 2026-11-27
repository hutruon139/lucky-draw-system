import React, { useCallback, useEffect, useRef } from "react";
import Reel from "./Reel";
import { formatTicket } from "../logic/spin";

// Left edges of the two digit cells on the designer's spin screen.
const REEL_LEFT = [1208, 1626];

export default function SlotMachine({ number, isSpinning, onSettled }) {
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
    if (done.current.size === REEL_LEFT.length) {
      active.current = false;
      callback.current?.();
    }
  }, []);
  const digits = formatTicket(number).split("");
  return <>
    {digits.map((digit, idx) => <Reel key={idx} targetDigit={Number(digit)} left={REEL_LEFT[idx]}
      spinning={isSpinning} index={idx} onSettled={settled} />)}
  </>;
}
