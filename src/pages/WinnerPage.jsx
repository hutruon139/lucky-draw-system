import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WinnerScreen from "../components/WinnerScreen";
import { usePrizeFlow } from "../components/PrizeFlowManager";

export default function WinnerPage() {
  const navigate = useNavigate();
  const { lastPrize, currentParticipant, nextDraw } = usePrizeFlow();

  useEffect(() => {
    if (!lastPrize || !currentParticipant) {
      navigate("/");
    }
  }, [lastPrize, currentParticipant, navigate]);

  const handleNext = () => {
    nextDraw();
    navigate("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-cyan-300 via-teal-500 to-teal-700 px-4 py-12">
      <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.15),transparent_40%)]" />
      <div className="relative">
        <WinnerScreen
          winner={currentParticipant}
          prizeType={lastPrize?.prizeType}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}
