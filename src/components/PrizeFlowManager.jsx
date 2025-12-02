import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generatePrizeQueues } from "../logic/generatePrizeQueue";
import { persistFlowToLocalStorage, restoreFlowFromLocalStorage } from "../logic/utils";

const PrizeContext = createContext(null);

export function PrizeFlowManager({ children }) {
  const initialFlowState = {
    prizeQueue: [],
    currentPrizeIndex: 0,
    currentParticipant: null,
    isSpinning: false,
  };

  const [flows, setFlows] = useState({
    secondThird: { ...initialFlowState },
    specialFirst: { ...initialFlowState },
  });

  useEffect(() => {
    const restoredA = restoreFlowFromLocalStorage("secondThird");
    const restoredB = restoreFlowFromLocalStorage("specialFirst");

    if (restoredA?.prizeQueue?.length && restoredB?.prizeQueue?.length) {
      setFlows({
        secondThird: {
          prizeQueue: restoredA.prizeQueue,
          currentPrizeIndex: restoredA.currentPrizeIndex || 0,
          currentParticipant: null,
          isSpinning: false,
        },
        specialFirst: {
          prizeQueue: restoredB.prizeQueue,
          currentPrizeIndex: restoredB.currentPrizeIndex || 0,
          currentParticipant: null,
          isSpinning: false,
        },
      });
      return;
    }

    const { secondThirdQueue, specialFirstQueue } = generatePrizeQueues();
    setFlows({
      secondThird: {
        prizeQueue: secondThirdQueue,
        currentPrizeIndex: 0,
        currentParticipant: null,
        isSpinning: false,
      },
      specialFirst: {
        prizeQueue: specialFirstQueue,
        currentPrizeIndex: 0,
        currentParticipant: null,
        isSpinning: false,
      },
    });
  }, []);

  useEffect(() => {
    persistFlowToLocalStorage(
      "secondThird",
      flows.secondThird.prizeQueue,
      flows.secondThird.currentPrizeIndex
    );
    persistFlowToLocalStorage(
      "specialFirst",
      flows.specialFirst.prizeQueue,
      flows.specialFirst.currentPrizeIndex
    );
  }, [flows]);

  const startSpin = (flowKey) => {
    setFlows((prev) => ({
      ...prev,
      [flowKey]: {
        ...prev[flowKey],
        isSpinning: true,
        currentParticipant: null,
      },
    }));
  };

  const stopSpin = (flowKey) => {
    const flow = flows[flowKey];
    const currentPrize = flow.prizeQueue[flow.currentPrizeIndex];
    if (!currentPrize) {
      setFlows((prev) => ({
        ...prev,
        [flowKey]: { ...prev[flowKey], isSpinning: false },
      }));
      return null;
    }
    setFlows((prev) => ({
      ...prev,
      [flowKey]: {
        ...prev[flowKey],
        isSpinning: false,
        currentParticipant: currentPrize.participant,
        currentPrizeIndex: prev[flowKey].currentPrizeIndex + 1,
      },
    }));
    return currentPrize;
  };

  const nextDraw = (flowKey) => {
    setFlows((prev) => ({
      ...prev,
      [flowKey]: {
        ...prev[flowKey],
        currentParticipant: null,
        isSpinning: false,
      },
    }));
  };

  const resetDraws = useCallback(() => {
    const { secondThirdQueue, specialFirstQueue } = generatePrizeQueues();
    setFlows({
      secondThird: {
        prizeQueue: secondThirdQueue,
        currentPrizeIndex: 0,
        currentParticipant: null,
        isSpinning: false,
      },
      specialFirst: {
        prizeQueue: specialFirstQueue,
        currentPrizeIndex: 0,
        currentParticipant: null,
        isSpinning: false,
      },
    });
  }, []);

  useEffect(() => {
    const handler = (event) => {
      if (event.key?.toLowerCase() === "r") {
        event.preventDefault();
        console.log("[RESET] Hotkey R pressed - resetting prize queues");
        resetDraws();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [resetDraws]);

  const value = {
    flows,
    startSpin,
    stopSpin,
    nextDraw,
    resetDraws,
  };

  return <PrizeContext.Provider value={value}>{children}</PrizeContext.Provider>;
}

export function usePrizeFlow(flowKey = "secondThird") {
  const context = useContext(PrizeContext);
  if (!context) {
    throw new Error("usePrizeFlow must be used within PrizeFlowManager");
  }
  const flow = context.flows[flowKey] || {
    prizeQueue: [],
    currentPrizeIndex: 0,
    currentParticipant: null,
    isSpinning: false,
  };
  const remaining =
    (flow.prizeQueue?.length || 0) - (flow.currentPrizeIndex || 0);
  const currentPrize =
    flow.prizeQueue && flow.prizeQueue[flow.currentPrizeIndex];
  const lastPrize =
    flow.currentPrizeIndex > 0
      ? flow.prizeQueue[flow.currentPrizeIndex - 1]
      : null;

  return {
    prizeQueue: flow.prizeQueue,
    currentPrizeIndex: flow.currentPrizeIndex,
    currentParticipant: flow.currentParticipant,
    isSpinning: flow.isSpinning,
    currentPrize: currentPrize || null,
    lastPrize,
    remaining,
    startSpin: () => context.startSpin(flowKey),
    stopSpin: () => context.stopSpin(flowKey),
    nextDraw: () => context.nextDraw(flowKey),
    resetDraws: context.resetDraws,
  };
}
