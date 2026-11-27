import { selectDraw, getEligiblePool, PRIZES } from "./generatePrizeQueue.js";
export const STORAGE_KEY = "lucky_draw_2026_v2";
const PHASES = ["standby", "spinning", "stopping", "winner", "award"];
export const initialState = () => ({ history: [], pending: null, phase: "standby" });
const prizeFinished = history => history.length > 0 && PRIZES[history.length] !== history.at(-1).prizeType;
export function currentPrize(state) {
  if (state.pending) return state.pending.prizeType;
  return state.phase === "standby" ? PRIZES[state.history.length] : state.history.at(-1).prizeType;
}
export function restoreState(raw, participants) {
  if (!raw) return initialState();
  const state = JSON.parse(raw);
  if (!Array.isArray(state.history) || !PHASES.includes(state.phase))
    throw new Error("Dữ liệu phiên quay không hợp lệ.");
  const history = [];
  for (const draw of state.history) {
    const valid = getEligiblePool(participants, history).find(p => p.number === draw.participant?.number);
    if (!valid || PRIZES[history.length] !== draw.prizeType) throw new Error("Lịch sử không khớp danh sách.");
    history.push({ prizeType: draw.prizeType, participant: valid });
  }
  let pending = null;
  if (state.pending) {
    const valid = getEligiblePool(participants, history).find(p => p.number === state.pending.participant?.number);
    if (!valid || !["standby", "spinning"].includes(state.phase) || state.pending.prizeType !== PRIZES[history.length])
      throw new Error("Lượt đang quay không hợp lệ.");
    pending = { prizeType: PRIZES[history.length], participant: valid };
  }
  if (state.phase === "spinning" && !pending) throw new Error("Thiếu lượt đang quay.");
  if (state.phase === "standby" && history.length === PRIZES.length) throw new Error("Đã quay hết giải.");
  if (["stopping", "winner", "award"].includes(state.phase) && !history.length) throw new Error("Thiếu kết quả quay.");
  if (state.phase === "award" && !prizeFinished(history)) throw new Error("Chưa quay đủ người cho giải này.");
  return { history, pending, phase: state.phase === "stopping" ? "winner" : state.phase === "spinning" ? "standby" : state.phase };
}
export function transition(state, action, participants, choose) {
  switch (action) {
    case "start": {
      if (state.phase !== "standby") return state;
      const pending = state.pending || selectDraw(participants, state.history, choose);
      return pending ? { ...state, pending, phase: "spinning" } : state;
    }
    case "stop": return state.phase === "spinning"
      ? { history: [...state.history, state.pending], pending: null, phase: "stopping" } : state;
    case "settled": return state.phase === "stopping" ? { ...state, phase: "winner" } : state;
    case "next": {
      if (state.phase === "award")
        return state.history.length < PRIZES.length ? { ...state, phase: "standby" } : state;
      if (state.phase !== "winner") return state;
      if (prizeFinished(state.history)) return { ...state, phase: "award" };
      // Giải ba: "Tiếp tục" quay luôn lượt kế tiếp của cùng giải.
      return { ...state, pending: selectDraw(participants, state.history, choose), phase: "spinning" };
    }
    default: return state;
  }
}
