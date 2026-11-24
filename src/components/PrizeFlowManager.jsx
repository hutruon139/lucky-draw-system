import React, { createContext, useContext, useRef, useState } from "react";
import participants from "../data/participants.json";
import { PRIZES, validateParticipants } from "../logic/generatePrizeQueue.js";
import { STORAGE_KEY, initialState, restoreState, transition } from "../logic/drawState.js";
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
    {state.error || failure ? <div role="alert" className="card p-6">{state.error || failure}</div> : children}
  </PrizeContext.Provider>;
}
export function usePrizeFlow() {
  const context = useContext(PrizeContext);
  if (!context) throw new Error("Thiếu PrizeFlowManager");
  const { state, act } = context;
  return {
    phase: state.phase,
    isSpinning: state.phase === "spinning",
    complete: state.history.length === PRIZES.length && state.phase === "idle",
    pending: state.pending,
    lastPrize: state.history.at(-1) || null,
    startSpin: () => act("start"), stopSpin: () => act("stop"),
    finishSpin: () => act("settled"), nextDraw: () => act("next"),
  };
}
