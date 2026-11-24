import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import WinnerScreen from "../components/WinnerScreen";
import { usePrizeFlow } from "../components/PrizeFlowManager";
import backgroundImage from "../../assets/background.svg";

export default function WinnerPage() {
  const navigate = useNavigate();
  const { lastPrize, phase, nextDraw } = usePrizeFlow();
  useEffect(() => {
    if (phase !== "winner" || !lastPrize) navigate("/", { replace: true });
  }, [lastPrize, phase, navigate]);
  const handleNext = () => {
    if (nextDraw()) navigate("/", { replace: true });
  };
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="absolute inset-0 bg-gradient-to-b" />
      <div className="relative">
        <WinnerScreen winner={lastPrize?.participant} prizeType={lastPrize?.prizeType}
          onNext={handleNext} isLast={lastPrize?.prizeType === "special"} />
      </div>
    </div>
  );
}
