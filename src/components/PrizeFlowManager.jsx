import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import participants from "../data/participants.json";
import { validateParticipants } from "../logic/generatePrizeQueue.js";
import { STORAGE_KEY, currentPrize, initialState, restoreState, transition } from "../logic/drawState.js";
import { hasResults, isResetKey, resetStoredState } from "../logic/reset.js";
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
  const reset = useCallback(() => {
    const problem = failure || latest.current.error;
    if (!problem && !hasResults(latest.current)) return;
    const message = problem
      ? `Phiên quay đang lỗi: ${problem}\n\nXóa dữ liệu đã lưu và bắt đầu lại từ Stand by giải ba? Không thể hoàn tác.`
      : `Xóa toàn bộ ${latest.current.history.length} kết quả đã quay và bắt đầu lại từ Stand by giải ba? Không thể hoàn tác.`;
    if (!window.confirm(message)) return;
    try {
      // Clear storage first; React state only changes once nothing old can be restored on reload.
      const next = resetStoredState(localStorage);
      latest.current = next;
      setFailure(null);
      setState(next);
    } catch (error) { setFailure(`Không thể reset: ${error.message}`); }
  }, [failure]);
  useEffect(() => {
    const onKey = event => {
      if (!isResetKey(event)) return;
      event.preventDefault();
      reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);
  return <PrizeContext.Provider value={{ state, act }}>
    {failure || state.error ? <div role="alert" className="card m-8 p-6 text-xl">
      <p>{failure || state.error}</p>
      <p className="mt-4">Nhấn phím R để xóa dữ liệu phiên quay và bắt đầu lại.</p>
    </div> : children}
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
