import participantsData from "../data/participants.json";

export const STORAGE_KEYS = {
  prizeQueueSecondThird: "lucky_draw_prize_queue_second_third",
  prizeIndexSecondThird: "lucky_draw_prize_index_second_third",
  prizeQueueSpecialFirst: "lucky_draw_prize_queue_special_first",
  prizeIndexSpecialFirst: "lucky_draw_prize_index_special_first",
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

export function restoreFlowFromLocalStorage(flowKey) {
  const keyMap = {
    secondThird: {
      queue: STORAGE_KEYS.prizeQueueSecondThird,
      index: STORAGE_KEYS.prizeIndexSecondThird,
    },
    specialFirst: {
      queue: STORAGE_KEYS.prizeQueueSpecialFirst,
      index: STORAGE_KEYS.prizeIndexSpecialFirst,
    },
  };
  const keys = keyMap[flowKey];
  if (!keys) return null;
  try {
    const queueRaw = localStorage.getItem(keys.queue);
    const indexRaw = localStorage.getItem(keys.index);
    if (!queueRaw) return null;
    const parsedQueue = JSON.parse(queueRaw);
    const parsedIndex = indexRaw ? parseInt(indexRaw, 10) : 0;
    return { prizeQueue: parsedQueue, currentPrizeIndex: parsedIndex || 0 };
  } catch (err) {
    console.warn("Failed to restore persisted state", err);
    return null;
  }
}

export function persistFlowToLocalStorage(flowKey, prizeQueue, currentPrizeIndex = 0) {
  const keyMap = {
    secondThird: {
      queue: STORAGE_KEYS.prizeQueueSecondThird,
      index: STORAGE_KEYS.prizeIndexSecondThird,
    },
    specialFirst: {
      queue: STORAGE_KEYS.prizeQueueSpecialFirst,
      index: STORAGE_KEYS.prizeIndexSpecialFirst,
    },
  };
  const keys = keyMap[flowKey];
  if (!keys) return;
  localStorage.setItem(keys.queue, JSON.stringify(prizeQueue));
  localStorage.setItem(keys.index, `${currentPrizeIndex}`);
}
