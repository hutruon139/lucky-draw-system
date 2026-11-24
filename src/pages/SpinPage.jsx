import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SlotMachine from "../components/SlotMachine";
import { usePrizeFlow } from "../components/PrizeFlowManager";
import backgroundImage from "../../assets/background.svg";

export default function SpinPage() {
  const navigate = useNavigate();
  const { startSpin, stopSpin, finishSpin, isSpinning, phase, lastPrize, complete } = usePrizeFlow();
  useEffect(() => {
    if (phase !== "winner") return;
    const timer = setTimeout(() => navigate("/winner", { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [phase, navigate]);
  const handleStart = () => startSpin();
  const handleStop = () => stopSpin();
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="h-36" />
      <div className="relative w-full max-w-4xl space-y-8 text-center text-white">
        <SlotMachine
          winningNumber={lastPrize?.participant.number || "000"}
          isSpinning={isSpinning}
          onSettled={finishSpin}
        />

        {/* ✅ buttons now directly under SlotMachine */}
        <div className="space-y-2 mt-0">
          <div className="mx-auto flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <ActionButton
              label="BẮT ĐẦU"
              onClick={handleStart}
              disabled={phase !== "idle" || complete}
              gradient="bg-[linear-gradient(90deg,#c69c6b,#f0d4a1,#c69c6b)]"
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
    text-3xl font-semibold uppercase tracking-wide

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
