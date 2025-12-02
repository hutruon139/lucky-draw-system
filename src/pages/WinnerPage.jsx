import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WinnerScreen from "../components/WinnerScreen";
import { usePrizeFlow } from "../components/PrizeFlowManager";
import backgroundImage from "../../assets/background.png";

export default function WinnerPage() {
  const navigate = useNavigate();
  const flowKey = import.meta.env.VITE_FLOW_MODE || "secondThird";
  const { lastPrize, currentParticipant, nextDraw } = usePrizeFlow(flowKey);

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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b" />
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
