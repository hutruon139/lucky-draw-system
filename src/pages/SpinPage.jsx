import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RollingCounter from "../components/RollingCounter";
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
  } = usePrizeFlow();
  const [frozenNumber, setFrozenNumber] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(false);

  const prizeLabel = currentPrize
    ? currentPrize.prizeType.toUpperCase()
    : prizeQueue.length && currentPrizeIndex >= prizeQueue.length
    ? "All prizes drawn"
    : "Loading queue...";

  const handleStart = () => {
    startSpin();
    setFrozenNumber(null);
    setPendingNavigation(false);
  };

  const handleStop = () => {
    if (pendingNavigation) return;
    const prize = stopSpin();
    if (prize?.participant) {
      setFrozenNumber(prize.participant.number);
      setPendingNavigation(true);
    } else {
      setFrozenNumber("000");
    }
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
        <RollingCounter
          isSpinning={isSpinning}
          frozenNumber={frozenNumber}
          onSettled={() => {
            if (pendingNavigation) {
              setTimeout(() => {
                navigate("/winner");
                setPendingNavigation(false);
              }, 1500); // brief pause after reels land
            }
          }}
        />
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
