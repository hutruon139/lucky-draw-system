import { loadParticipants, persistQueue, shuffle } from "./utils";

const PRIZE_COUNTS = {
  first: 1,
  second: 3,
  third: 10,
  special: 6,
};

export function generatePrizeQueues() {
  const participants = loadParticipants();
  const rigged = participants.filter((p) => p.isRigged);
  const normal = participants.filter(
    (p) => !p.isRigged && p.isEligible !== false
  );

  const shuffledRigged = shuffle(rigged);
  const shuffledNormal = shuffle(normal);

  const firstPrizeWinner = shuffledRigged[0];
  const specialPrizeWinners = shuffledRigged.slice(1, 1 + PRIZE_COUNTS.special);
  // For the third/second flow we now just consume everyone in the normal pool
  // until we run out (no fixed prize counts).
  const secondThirdQueue = shuffledNormal.map((participant) => ({
    prizeType: "draw",
    participant,
  }));

  const specialFirstQueue = [
    ...specialPrizeWinners.map((participant) => ({
      prizeType: "special",
      participant,
    })),
    { prizeType: "first", participant: firstPrizeWinner },
  ];

  return { secondThirdQueue, specialFirstQueue };
}
