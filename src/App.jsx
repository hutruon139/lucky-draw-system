import React from "react";
import { Route, Routes } from "react-router-dom";
import { PrizeFlowManager } from "./components/PrizeFlowManager";
import SpinPage from "./pages/SpinPage";
import WinnerPage from "./pages/WinnerPage";

export default function App() {
  return (
    <PrizeFlowManager>
      <Routes>
        <Route path="/" element={<SpinPage />} />
        <Route path="/winner" element={<WinnerPage />} />
      </Routes>
    </PrizeFlowManager>
  );
}
