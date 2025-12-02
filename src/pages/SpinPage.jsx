import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SlotMachine from "../components/SlotMachine";
import { formatTicket } from "../logic/spin";
import { usePrizeFlow } from "../components/PrizeFlowManager";
import backgroundImage from "../../assets/background.png";

export default function SpinPage() {
  const navigate = useNavigate();
  const flowKey = import.meta.env.VITE_FLOW_MODE || "secondThird";
  const {
    startSpin,
    stopSpin,
    isSpinning,
    currentPrize,
    prizeQueue,
    currentPrizeIndex,
    resetDraws,
    remaining,
  } = usePrizeFlow(flowKey);
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

  useEffect(() => {
    console.log(`[FLOW:${flowKey}] contestants left: ${remaining}`);
  }, [remaining, flowKey]);

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
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 py-12"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/40 to-slate-900/60" />
      <div className="relative w-full max-w-4xl space-y-8 text-center text-white">
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
      </div>
        <div className="absolute space-y-8 bottom-20">
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
              label="RESET"
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
