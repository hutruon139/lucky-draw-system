import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePrizeFlow } from "./PrizeFlowManager";
import Stage from "./Stage";
import SlotMachine from "./SlotMachine";
import FitText from "./FitText";
import { preloadAssets, screenImage } from "../screens";
import { formatTicket } from "../logic/spin";

const HOLD_MS = 1500;
// Ignore input right after a screen change so a double click or key repeat cannot skip a screen.
const INPUT_GUARD_MS = 800;
const KEYS = [" ", "Enter", "ArrowRight", "PageDown"];
// Button positions on the designer's 2816x1536 screens.
const START_BUTTON = { left: 1090, top: 1352, width: 640, height: 158 };
const CONTINUE_BUTTON = { left: 1165, top: 1340, width: 486, height: 140 };

export default function DrawScreen() {
  const { phase, prize, pending, lastPrize, start, stop, settled, next } = usePrizeFlow();
  const [holding, setHolding] = useState(false);
  useEffect(preloadAssets, []);
  useEffect(() => {
    if (!holding) return;
    const timer = setTimeout(() => setHolding(false), HOLD_MS);
    return () => clearTimeout(timer);
  }, [holding]);

  const screen = phase === "standby" ? "standby" : phase === "award" ? "award"
    : phase === "winner" && !holding ? "announce" : "spin";
  const shownAt = useRef(0);
  useEffect(() => { shownAt.current = performance.now(); }, [screen, phase]);

  const advance = useCallback(() => {
    if (performance.now() - shownAt.current < INPUT_GUARD_MS) return;
    if (screen === "standby") start();
    else if (screen === "spin") { if (phase === "spinning") stop(); }
    else next();
  }, [screen, phase, start, stop, next]);

  useEffect(() => {
    const onKey = event => {
      if (!KEYS.includes(event.key) || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  // Holding and settling happen in one batched update, so the announcement never flashes early.
  const onSettled = useCallback(() => { setHolding(true); settled(); }, [settled]);
  const hasButton = screen === "standby" || (screen === "announce" && prize === "third");

  return (
    <Stage onClick={hasButton ? undefined : advance}>
      <img src={screenImage(prize, screen)} alt="" decoding="sync" draggable={false} className="screen-image" />
      {screen === "standby" && <Hotspot box={START_BUTTON} label="Bắt đầu" onClick={advance} />}
      {screen === "spin" && <SlotMachine number={(pending ?? lastPrize).participant.number}
        isSpinning={phase === "spinning"} onSettled={onSettled} />}
      {screen === "announce" && <Announcement participant={lastPrize.participant} />}
      {screen === "announce" && prize === "third" && <Hotspot box={CONTINUE_BUTTON} label="Tiếp tục" onClick={advance} />}
    </Stage>
  );
}

function Announcement({ participant }) {
  const [tens, ones] = formatTicket(participant.number);
  return <>
    <div className="announce-code">{tens} {ones}</div>
    <div className="announce-line announce-name-line">
      <FitText text={participant.name} size={98} maxWidth={1440} className="announce-name" />
    </div>
    <div className="announce-line announce-distributor-line">
      <FitText text={participant.distributor} size={49.5} maxWidth={1440} className="announce-distributor" />
    </div>
  </>;
}

function Hotspot({ box, label, onClick }) {
  return <button type="button" aria-label={label} tabIndex={-1} className="hotspot" style={box}
    onMouseDown={event => event.preventDefault()}
    onClick={event => { event.stopPropagation(); onClick(); }} />;
}
