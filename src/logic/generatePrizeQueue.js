export const PRIZES = [...Array(15).fill("third"), "second", "first", "special"];
export const THIRD_QUOTAS = { north: 4, central: 3, southeast: 2, southwest: 1, logistics: 2, xnk: 2, chemicals: 1 };
export const GROUP_TWO_QUOTAS = { central: 6, southeast: 2, southwest: 1 };

export function getEligiblePool(participants, history) {
  const prize = PRIZES[history.length];
  if (!prize) return [];
  const won = new Set(history.map(d => d.participant.number));
  const relevant = history.filter(d => prize === "third" ? d.prizeType === "third" : ["second", "first"].includes(d.prizeType));
  const counts = relevant.reduce((a, d) => { const r = d.participant.region; a[r] = (a[r] || 0) + 1; return a; }, {});
  return participants.filter(p => {
    if (p.isEligible === false || won.has(p.number)) return false;
    if (prize === "special") return p.group === 1 && ["central", "southeast"].includes(p.region);
    if (prize === "third") return p.group === 3 && (counts[p.region] || 0) < (THIRD_QUOTAS[p.region] || 0);
    // All 15 group-two attendees enter, including North (no North cap specified).
    return p.group === 2 && (counts[p.region] || 0) < (GROUP_TWO_QUOTAS[p.region] ?? Infinity);
  });
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
  if (!pool.length) throw new Error("Không còn người hợp lệ cho giải hiện tại. Kiểm tra danh sách và quota.");
  return { prizeType: PRIZES[history.length], participant: pool[choose(pool.length)] };
}
export function validateParticipants(participants) {
  const tickets = participants.map(p => p.number);
  if (new Set(tickets).size !== tickets.length || tickets.some(t => !/^\d{3}$/.test(t)))
    throw new Error("Mã dự thưởng phải gồm 3 chữ số và không được trùng.");
  for (const [region, quota] of Object.entries(THIRD_QUOTAS))
    if (participants.filter(p => p.group === 3 && p.region === region && p.isEligible !== false).length < quota)
      throw new Error(`Không đủ người Nhóm 3 cho quota ${region}.`);
}
