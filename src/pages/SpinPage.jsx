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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="relative w-full max-w-4xl space-y-8 text-center text-white">
        <SlotMachine
          winningNumber={frozenNumber || undefined}
          isSpinning={isSpinning}
          onSettled={() => {
            if (pendingNavigation) {
              setTimeout(() => {
                navigate("/winner");
                setPendingNavigation(false);
              }, 7000); // pause for 10s after landing
            }
          }}
        />
      </div>
        <div className="absolute space-y-2 bottom-20">
          <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <ActionButton
              label="BẮT ĐẦU"
              onClick={handleStart}
              disabled={isSpinning}
              gradient="bg-[linear-gradient(90deg,#c69c6b,#f0d4a1,#c69c6b)] "
              textClass="text-teal-800"
            />
          </div>
          <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <ActionButton
              label="DỪNG LẠI"
              onClick={handleStop}
              disabled={!isSpinning}
              gradient="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
              textClass="text-slate-800"
            />
          </div>
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
  className={`
    w-full sm:w-auto
    rounded-full
    px-10 py-3
    text-xl font-semibold uppercase tracking-wide

    ${gradient}      /* keep your dynamic gradient */
    text-[#134A46]                    /* dark teal text */

    border-8 border-[#299b93]         /* thick teal border like reference */

    shadow-[0_0_20px_rgba(44,166,169,0.35),
            inset_0_2px_6px_rgba(255,255,255,0.35),
            inset_0_-4px_10px_rgba(0,0,0,0.35)]
    drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]

    transition-transform duration-150
    hover:scale-[1.03]
    active:scale-[0.98]
    disabled:cursor-not-allowed disabled:opacity-60
  `}
>
  <span className={`${textClass} drop-shadow`}>{label}</span>
</button>

  );
}
