import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SlotMachine from "../components/SlotMachine";
import { formatTicket } from "../logic/spin";
import { usePrizeFlow } from "../components/PrizeFlowManager";

export default function SpinPage() {
  const navigate = useNavigate();
  const {
    startSpin,
    stopSpin,
    isSpinning,
    currentPrize,
    prizeQueue,
    currentPrizeIndex,
    resetDraws,
  } = usePrizeFlow();
  const [pendingNavigation, setPendingNavigation] = useState(false);
  const [targetNumber, setTargetNumber] = useState(null);
  const [frozenNumber, setFrozenNumber] = useState(null);
  const [testReelIdx, setTestReelIdx] = useState(0);
  const [testDigit, setTestDigit] = useState("0");

  const prizeLabel = currentPrize
    ? currentPrize.prizeType.toUpperCase()
    : prizeQueue.length && currentPrizeIndex >= prizeQueue.length
    ? "All prizes drawn"
    : "Loading queue...";

  const handleStart = () => {
    if (!currentPrize?.participant?.number) return;
    setPendingNavigation(false);
    setTargetNumber(formatTicket(currentPrize.participant.number)); // store 3-digit target padded
    setFrozenNumber(null); // clear previous result
    startSpin();
  };

  const handleStop = () => {
    if (!targetNumber) {
      return;
    }
    setFrozenNumber(targetNumber); // set target first so reels read it immediately
    // tell reels to land and advance prize index
    stopSpin();
    setPendingNavigation(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-cyan-300 via-teal-500 to-teal-700 px-4 py-12">
      <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.15),transparent_40%)]" />
      <div className="relative w-full max-w-4xl space-y-8 text-center text-white">
        <h1 className="text-3xl font-extrabold tracking-wide drop-shadow-lg">
          Vòng Quay May Mắn
        </h1>
        <p className="text-sm uppercase tracking-[0.4em] text-amber-200/90 drop-shadow">
          {prizeLabel}
        </p>
        <SlotMachine
          winningNumber={frozenNumber || undefined}
          isSpinning={isSpinning}
          onSettled={() => {
            if (pendingNavigation) {
              setTimeout(() => {
                navigate("/winner");
                setPendingNavigation(false);
              }, 5000); // pause for 10s after landing
            }
          }}
        />
        <div className="mx-auto max-w-xl space-y-2 rounded-xl bg-white/10 p-3 text-sm text-white">
          <div className="font-semibold">Test single reel</div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2">
              Reel (0-2):
              <input
                type="number"
                min="0"
                max="2"
                value={testReelIdx}
                onChange={(e) =>
                  setTestReelIdx(
                    Math.min(2, Math.max(0, Number(e.target.value) || 0))
                  )
                }
                className="w-16 rounded bg-white/20 px-2 py-1 text-white"
              />
            </label>
            <label className="flex items-center gap-2">
              Digit (0-9):
              <input
                type="number"
                min="0"
                max="9"
                value={testDigit}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isNaN(v)) return;
                  setTestDigit(String(Math.min(9, Math.max(0, v))));
                }}
                className="w-16 rounded bg-white/20 px-2 py-1 text-white"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const digits = ["0", "0", "0"];
                digits[testReelIdx] = testDigit;
                setFrozenNumber(digits.join(""));
                setPendingNavigation(false);
              }}
              className="rounded bg-amber-300 px-3 py-1 font-semibold text-amber-900 shadow"
            >
              Test Reel
            </button>
          </div>
          <p className="text-xs text-white/70">
            Sets a temporary winning number with just the selected reel digit.
            Other reels land on 0.
          </p>
        </div>
        <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <ActionButton
            label="BẮT ĐẦU"
            onClick={handleStart}
            disabled={isSpinning}
            gradient="from-amber-200 via-amber-100 to-amber-200"
            textClass="text-teal-800"
          />
        </div>
        <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <ActionButton
            label="DỪNG LẠI"
            onClick={handleStop}
            disabled={!isSpinning}
            gradient="from-slate-200 via-slate-100 to-slate-200"
            textClass="text-slate-800"
          />
        </div>
        {!currentPrize && prizeQueue.length > 0 && (
          <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <ActionButton
              label="RESET (TEST)"
              onClick={() => {
                resetDraws();
                setFrozenNumber(null);
                setPendingNavigation(false);
              }}
              disabled={isSpinning}
              gradient="from-rose-200 via-rose-100 to-rose-200"
              textClass="text-rose-900"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, disabled, gradient, textClass }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-full bg-gradient-to-r ${gradient} px-6 py-3 text-lg font-semibold uppercase tracking-wide shadow-lg shadow-teal-900/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
    >
      <span className={`${textClass} drop-shadow`}>{label}</span>
    </button>
  );
}
