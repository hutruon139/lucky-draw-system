import { STORAGE_KEY, initialState } from "./drawState.js";

// Plain R only: Ctrl/Cmd+R must still reload the page, and a held key must not open the dialog again.
export const isResetKey = event => (event.key === "r" || event.key === "R")
  && !event.repeat && !event.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey;
export const hasResults = state => state.history.length > 0 || state.pending !== null || state.phase !== "standby";
export function resetStoredState(storage) {
  storage.removeItem(STORAGE_KEY);
  if (storage.getItem(STORAGE_KEY) !== null) throw new Error("Không xóa được phiên quay đã lưu.");
  return initialState();
}
