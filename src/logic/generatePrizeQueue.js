import { loadParticipants, persistQueue, shuffle } from "./utils";

const PRIZE_COUNTS = {
  first: 1,
  second: 3,
  third: 10,
  special: 6,
};

export function generatePrizeQueue() {
  const participants = loadParticipants();
  const rigged = participants.filter((p) => p.isRigged);
  const normal = participants.filter(
    (p) => !p.isRigged && p.isEligible !== false
  );

  const shuffledRigged = shuffle(rigged);
  const shuffledNormal = shuffle(normal);

  const firstPrizeWinner = shuffledRigged[0];
  const specialPrizeWinners = shuffledRigged.slice(1, 1 + PRIZE_COUNTS.special);
  const secondPrizeWinners = shuffledNormal.slice(0, PRIZE_COUNTS.second);
  const thirdPrizeWinners = shuffledNormal.slice(
    PRIZE_COUNTS.second,
    PRIZE_COUNTS.second + PRIZE_COUNTS.third
  );

  // Order: third prizes first, then second, then special, then first.
  // This matches flow where smaller prizes are drawn before headline prizes.
  const prizeQueue = [
    ...thirdPrizeWinners.map((participant) => ({
      prizeType: "third",
      participant,
    })),
    ...secondPrizeWinners.map((participant) => ({
      prizeType: "second",
      participant,
    })),
    ...specialPrizeWinners.map((participant) => ({
      prizeType: "special",
      participant,
    })),
    { prizeType: "first", participant: firstPrizeWinner },
  ];

  persistQueue(prizeQueue, 0);
  return prizeQueue;
}
