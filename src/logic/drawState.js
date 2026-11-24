import { selectDraw, getEligiblePool, PRIZES } from "./generatePrizeQueue.js";
export const STORAGE_KEY = "lucky_draw_2026_v1";
export const initialState = () => ({ history: [], pending: null, phase: "idle" });
export function restoreState(raw, participants) {
  if (!raw) return initialState();
  const state = JSON.parse(raw);
  if (!Array.isArray(state.history) || !["idle", "spinning", "stopping", "winner"].includes(state.phase))
    throw new Error("Dữ liệu phiên quay không hợp lệ.");
  const history = [];
  for (const draw of state.history) {
    const valid = getEligiblePool(participants, history).find(p => p.number === draw.participant?.number);
    if (!valid || PRIZES[history.length] !== draw.prizeType) throw new Error("Lịch sử không khớp danh sách hoặc quota.");
    history.push({ prizeType: draw.prizeType, participant: valid });
  }
  let pending = null;
  if (state.pending) {
    const valid = getEligiblePool(participants, history).find(p => p.number === state.pending.participant?.number);
    if (!valid || !["idle", "spinning"].includes(state.phase) || state.pending.prizeType !== PRIZES[history.length])
      throw new Error("Lượt đang quay không hợp lệ.");
    pending = { prizeType: PRIZES[history.length], participant: valid };
  }
  if (state.phase === "spinning" && !pending) throw new Error("Thiếu lượt đang quay.");
  if (["winner", "stopping"].includes(state.phase) && !history.length) throw new Error("Thiếu kết quả quay.");
  return { history, pending, phase: state.phase === "stopping" ? "winner" : state.phase === "spinning" ? "idle" : state.phase };
}
export function transition(state, action, participants, choose) {
  switch (action) {
    case "start": {
      if (state.phase !== "idle") return state;
      const pending = state.pending || selectDraw(participants, state.history, choose);
      return pending ? { ...state, pending, phase: "spinning" } : state;
    }
    case "stop": return state.phase === "spinning"
      ? { history: [...state.history, state.pending], pending: null, phase: "stopping" } : state;
    case "settled": return state.phase === "stopping" ? { ...state, phase: "winner" } : state;
    case "next": return state.phase === "winner" ? { ...state, phase: "idle" } : state;
    default: return state;
  }
}
