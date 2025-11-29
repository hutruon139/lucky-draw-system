import { zeroPad } from "./utils";

const MIN_NUMBER = 1;
const MAX_NUMBER = 200;

export function getRandomTicketNumber() {
  const value =
    Math.floor(Math.random() * (MAX_NUMBER - MIN_NUMBER + 1)) + MIN_NUMBER;
  return zeroPad(value, 3);
}

export function formatTicket(number) {
  return zeroPad(number, 3);
}
