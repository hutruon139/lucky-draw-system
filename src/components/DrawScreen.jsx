import React, { useCallback, useEffect, useRef, useState } from "react";
import { usePrizeFlow } from "./PrizeFlowManager";
import Stage from "./Stage";
import SlotMachine from "./SlotMachine";
import FitText from "./FitText";
import { SCREEN_IMAGES, screenImage } from "../screens";
import { formatTicket } from "../logic/spin";

const HOLD_MS = 1500;
// Ignore input right after a screen change so a double click or key repeat cannot skip a screen.
const INPUT_GUARD_MS = 800;
const KEYS = [" ", "Enter", "ArrowRight", "PageDown"];
const DIGIT_FONT = '700 100px "Gotham Rounded"';
// Button positions on the designer's 2816x1536 screens.
const START_BUTTON = { left: 1160, top: 1395, width: 500, height: 122 };
const STOP_BUTTON = { left: 1168, top: 1345, width: 480, height: 126 };
const CONTINUE_BUTTON = { left: 1168, top: 1345, width: 480, height: 126 };

export default function DrawScreen() {
  const { phase, prize, pending, lastPrize, start, stop, settled, next } = usePrizeFlow();
  const [ready, setReady] = useState(false);
  const [holding, setHolding] = useState(false);
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
    if (!ready || performance.now() - shownAt.current < INPUT_GUARD_MS) return;
    if (screen === "standby") start();
    else if (screen === "spin") { if (phase === "spinning") stop(); }
    else next();
  }, [ready, screen, phase, start, stop, next]);

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
  const hasButton = screen === "standby" || screen === "spin" || (screen === "announce" && prize === "third");

  return (
    <Stage onClick={hasButton ? undefined : advance}>
      <Backgrounds current={ready && screenImage(prize, screen)} onReady={setReady} />
      {ready && <>
        {screen === "standby" && <Hotspot box={START_BUTTON} label="Bắt đầu" onClick={advance} />}
        {screen === "spin" && <SlotMachine number={(pending ?? lastPrize).participant.number}
          isSpinning={phase === "spinning"} onSettled={onSettled} />}
        {screen === "spin" && <Hotspot box={STOP_BUTTON} label="Dừng" onClick={advance}
          disabled={phase !== "spinning"} />}
        {screen === "announce" && <Announcement participant={lastPrize.participant} />}
        {screen === "announce" && prize === "third" && <Hotspot box={CONTINUE_BUTTON} label="Tiếp tục" onClick={advance} />}
      </>}
    </Stage>
  );
}

// Every screen image stays mounted and a screen change only flips visibility. Swapping one <img>'s
// src can reload the file asynchronously, which shows the new numbers on top of the old background.
function Backgrounds({ current, onReady }) {
  const layer = useRef(null);
  useEffect(() => {
    let active = true;
    const images = [...layer.current.children].map(image => image.decode());
    Promise.allSettled([...images, document.fonts?.load(DIGIT_FONT)]).then(() => { if (active) onReady(true); });
    return () => { active = false; };
  }, [onReady]);
  return <div ref={layer}>
    {SCREEN_IMAGES.map(src => <img key={src} src={src} alt="" decoding="sync" draggable={false}
      className="screen-image" style={{ visibility: src === current ? "visible" : "hidden" }} />)}
  </div>;
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

function Hotspot({ box, label, onClick, disabled = false }) {
  return <button type="button" aria-label={label} disabled={disabled} className="hotspot" style={box}
    onMouseDown={event => event.preventDefault()}
    onKeyDown={event => {
      // Global handler owns the presenter keys; prevent a second synthetic button click.
      if (KEYS.includes(event.key)) event.preventDefault();
    }}
    onClick={event => { event.stopPropagation(); onClick(); }} />;
}
