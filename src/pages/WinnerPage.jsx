import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WinnerScreen from "../components/WinnerScreen";
import { usePrizeFlow } from "../components/PrizeFlowManager";
import backgroundImage from "../../assets/background.png";

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
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-900 px-4 py-12"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/40 to-slate-900/60" />
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
