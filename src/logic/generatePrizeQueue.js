export const PRIZES = [...Array(15).fill("third"), "second", "first", "special"];
// Giải nhất và giải nhì quay chung một danh sách.
export const PRIZE_POOLS = { third: "third", second: "main", first: "main", special: "special" };
export const THIRD_QUOTAS = {
  north: 4, central: 3, southeast: 2, southwest: 1,
  logistics: 2, xnk: 2, chemicals: 1,
};

export function getEligiblePool(participants, history) {
  const prize = PRIZES[history.length];
  if (!prize) return [];
  const won = new Set(history.map(d => d.participant.number));
  const regionWins = history.filter(d => d.prizeType === "third").reduce((counts, draw) => {
    const region = draw.participant.region;
    counts[region] = (counts[region] || 0) + 1;
    return counts;
  }, {});
  return participants.filter(p => p.pool === PRIZE_POOLS[prize] && p.isEligible !== false && !won.has(p.number)
    && (prize !== "third" || (regionWins[p.region] || 0) < (THIRD_QUOTAS[p.region] || 0)));
}
export function randomIndex(length) {
  if (!Number.isInteger(length) || length < 1) throw new Error("Pool không hợp lệ.");
  const limit = 2 ** 32 - (2 ** 32 % length);
  const value = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % length;
}
export function selectDraw(participants, history, choose = randomIndex) {
  const pool = getEligiblePool(participants, history);
  if (!PRIZES[history.length]) return null;
  if (!pool.length) throw new Error("Không còn người hợp lệ cho giải hiện tại. Kiểm tra danh sách.");
  return { prizeType: PRIZES[history.length], participant: pool[choose(pool.length)] };
}
export function validateParticipants(participants) {
  const tickets = participants.map(p => p.number);
  if (new Set(tickets).size !== tickets.length || tickets.some(t => !/^\d{2}$/.test(t)))
    throw new Error("Mã dự thưởng phải gồm 2 chữ số và không được trùng.");
  for (const pool of new Set(Object.values(PRIZE_POOLS))) {
    const prizes = PRIZES.filter(prize => PRIZE_POOLS[prize] === pool).length;
    if (participants.filter(p => p.pool === pool && p.isEligible !== false).length < prizes)
      throw new Error(`Danh sách "${pool}" không đủ ${prizes} người.`);
  }
  if (participants.some(p => p.pool === "third" && !Object.hasOwn(THIRD_QUOTAS, p.region)))
    throw new Error("Có người giải ba chưa được gán vùng/khối hợp lệ.");
  for (const [region, quota] of Object.entries(THIRD_QUOTAS)) {
    if (participants.filter(p => p.pool === "third" && p.region === region && p.isEligible !== false).length < quota)
      throw new Error(`Vùng/khối "${region}" không đủ ${quota} người cho giải ba.`);
  }
}
