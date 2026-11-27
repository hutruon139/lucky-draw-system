import React from "react";
import { PrizeFlowManager } from "./components/PrizeFlowManager";
import DrawScreen from "./components/DrawScreen";

export default function App() {
  return (
    <PrizeFlowManager>
      <DrawScreen />
    </PrizeFlowManager>
  );
}
