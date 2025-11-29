import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generatePrizeQueue } from "../logic/generatePrizeQueue";
import {
  persistQueue,
  restoreStateFromLocalStorage,
} from "../logic/utils";

const PrizeContext = createContext(null);

export function PrizeFlowManager({ children }) {
  const [prizeQueue, setPrizeQueue] = useState([]);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const restored = restoreStateFromLocalStorage();
    if (restored?.prizeQueue?.length) {
      setPrizeQueue(restored.prizeQueue);
      setCurrentPrizeIndex(restored.currentPrizeIndex || 0);
    } else {
      const queue = generatePrizeQueue();
      setPrizeQueue(queue);
      setCurrentPrizeIndex(0);
    }
  }, []);

  useEffect(() => {
    if (prizeQueue.length) {
      persistQueue(prizeQueue, currentPrizeIndex);
    }
  }, [prizeQueue, currentPrizeIndex]);

  const currentPrize = useMemo(
    () => prizeQueue[currentPrizeIndex] || null,
    [prizeQueue, currentPrizeIndex]
  );
  const lastPrize = useMemo(
    () => (currentPrizeIndex > 0 ? prizeQueue[currentPrizeIndex - 1] : null),
    [prizeQueue, currentPrizeIndex]
  );

  const startSpin = () => {
    setIsSpinning(true);
    setCurrentParticipant(null);
  };

  const stopSpin = () => {
    if (!currentPrize) {
      setIsSpinning(false);
      return null;
    }
    setIsSpinning(false);
    setCurrentParticipant(currentPrize.participant);
    setCurrentPrizeIndex((prev) => prev + 1);
    return currentPrize;
  };

  const nextDraw = () => {
    setCurrentParticipant(null);
    setIsSpinning(true);
  };

  const resetDraws = useCallback(() => {
    const queue = generatePrizeQueue();
    setPrizeQueue(queue);
    setCurrentPrizeIndex(0);
    setCurrentParticipant(null);
    setIsSpinning(false);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    const handler = (event) => {
      if (event.key?.toLowerCase() === "r") {
        event.preventDefault();
        resetDraws();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [resetDraws]);

  const value = {
    prizeQueue,
    currentPrizeIndex,
    currentParticipant,
    isSpinning,
    currentPrize,
    lastPrize,
    startSpin,
    stopSpin,
    nextDraw,
    resetDraws,
  };

  return <PrizeContext.Provider value={value}>{children}</PrizeContext.Provider>;
}

export function usePrizeFlow() {
  const context = useContext(PrizeContext);
  if (!context) {
    throw new Error("usePrizeFlow must be used within PrizeFlowManager");
  }
  return context;
}
