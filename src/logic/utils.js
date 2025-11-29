import participantsData from "../data/participants.json";

export const STORAGE_KEYS = {
  prizeQueue: "lucky_draw_prize_queue",
  prizeIndex: "lucky_draw_prize_index",
};

export function zeroPad(num, size = 3) {
  const s = String(num);
  if (s.length >= size) return s;
  return `${"0".repeat(size - s.length)}${s}`;
}

export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function loadParticipants() {
  return participantsData;
}

export function restoreStateFromLocalStorage() {
  try {
    const queueRaw = localStorage.getItem(STORAGE_KEYS.prizeQueue);
    const indexRaw = localStorage.getItem(STORAGE_KEYS.prizeIndex);
    if (!queueRaw) return null;
    const parsedQueue = JSON.parse(queueRaw);
    const parsedIndex = indexRaw ? parseInt(indexRaw, 10) : 0;
    return { prizeQueue: parsedQueue, currentPrizeIndex: parsedIndex || 0 };
  } catch (err) {
    console.warn("Failed to restore persisted state", err);
    return null;
  }
}

export function persistQueue(prizeQueue, currentPrizeIndex = 0) {
  localStorage.setItem(STORAGE_KEYS.prizeQueue, JSON.stringify(prizeQueue));
  localStorage.setItem(STORAGE_KEYS.prizeIndex, `${currentPrizeIndex}`);
}
