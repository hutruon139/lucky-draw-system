import React, { createContext, useContext, useRef, useState } from "react";
import participants from "../data/participants.json";
import { validateParticipants } from "../logic/generatePrizeQueue.js";
import { STORAGE_KEY, currentPrize, initialState, restoreState, transition } from "../logic/drawState.js";
const PrizeContext = createContext(null);
validateParticipants(participants);
export function PrizeFlowManager({ children }) {
  const [failure, setFailure] = useState(null);
  const [state, setState] = useState(() => {
    try { return restoreState(localStorage.getItem(STORAGE_KEY), participants); }
    catch (error) { return { ...initialState(), error: error.message }; }
  });
  const latest = useRef(state);
  const act = action => {
    if (latest.current.error || failure) return null;
    try {
      const next = transition(latest.current, action, participants);
      // Save before displaying a change. A storage error must not lose a winner.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      latest.current = next;
      setState(next);
      return next;
    } catch (error) { setFailure(error.message); return null; }
  };
  return <PrizeContext.Provider value={{ state, act }}>
    {state.error || failure ? <div role="alert" className="card m-8 p-6 text-xl">{state.error || failure}</div> : children}
  </PrizeContext.Provider>;
}
export function usePrizeFlow() {
  const context = useContext(PrizeContext);
  if (!context) throw new Error("Thiếu PrizeFlowManager");
  const { state, act } = context;
  return {
    phase: state.phase,
    prize: currentPrize(state),
    pending: state.pending,
    lastPrize: state.history.at(-1) || null,
    start: () => act("start"), stop: () => act("stop"),
    settled: () => act("settled"), next: () => act("next"),
  };
}
