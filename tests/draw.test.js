import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PRIZES, getEligiblePool, selectDraw, validateParticipants } from "../src/logic/generatePrizeQueue.js";
import { initialState, transition, restoreState, currentPrize } from "../src/logic/drawState.js";
import { SPEED, stoppingPlan, stoppingPosition } from "../src/logic/reelMotion.js";

const people = JSON.parse(fs.readFileSync(new URL("../src/data/participants.json", import.meta.url)));
const first = () => 0;
const numbers = pool => people.filter(p => p.pool === pool).map(p => p.number).sort();
function drawUntil(count, choose = first) {
  const history = [];
  while (history.length < count) history.push(selectDraw(people, history, choose));
  return history;
}

test("61 unique two-digit codes in the three lists from the workbook", () => {
  validateParticipants(people);
  assert.equal(people.length, 61);
  assert.deepEqual(numbers("special"), ["01", "02", "04", "06"]);
  assert.deepEqual(numbers("main"), ["10", "11", "12", "13", "14", "15", "17", "18", "20"]);
  assert.deepEqual(numbers("third"), Array.from({ length: 48 }, (_, i) => String(i + 25)));
  assert.throws(() => validateParticipants(people.map(p => ({ ...p, number: `0${p.number}` }))));
  assert.throws(() => validateParticipants([...people, { ...people[0] }]));
  assert.throws(() => validateParticipants(people.filter(p => p.pool !== "special")));
});

test("first prize draws from the same nine people as second prize, minus the second-prize winner", () => {
  const history = drawUntil(15);
  assert.deepEqual(getEligiblePool(people, history).map(p => p.number).sort(), numbers("main"));
  history.push(selectDraw(people, history, () => 4));
  const pool = getEligiblePool(people, history);
  assert.equal(pool.length, 8);
  assert.ok(pool.every(p => p.pool === "main" && p.number !== history[15].participant.number));
});

test("1000 seeded full draws keep prize order, lists and no repeat winners", () => {
  let seed = 2026;
  const choose = length => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 2 ** 32 * length); };
  const expected = { third: "third", second: "main", first: "main", special: "special" };
  for (let run = 0; run < 1000; run++) {
    const history = [];
    for (const prize of PRIZES) {
      const draw = selectDraw(people, history, choose);
      assert.equal(draw.prizeType, prize);
      assert.equal(draw.participant.pool, expected[prize]);
      history.push(draw);
    }
    assert.equal(new Set(history.map(d => d.participant.number)).size, 18);
    assert.equal(selectDraw(people, history), null);
  }
});

test("Giải ba continues straight to the next spin; every prize ends on its award screen", () => {
  let state = initialState();
  const act = action => (state = transition(state, action, people, first));
  act("start");
  for (let i = 0; i < 15; i++) {
    assert.equal(state.phase, "spinning");
    assert.equal(currentPrize(state), "third");
    act("stop"); act("settled");
    assert.equal(state.phase, "winner");
    act("next");
  }
  assert.equal(state.phase, "award");
  assert.equal(currentPrize(state), "third");
  for (const prize of ["second", "first", "special"]) {
    act("next");
    assert.equal(state.phase, "standby");
    assert.equal(currentPrize(state), prize);
    act("start"); act("stop"); act("settled"); act("next");
    assert.equal(state.phase, "award");
    assert.equal(currentPrize(state), prize);
  }
  assert.equal(state.history.length, PRIZES.length);
  assert.equal(transition(state, "next", people), state);
  assert.equal(transition(state, "start", people), state);
});

test("double clicks cannot consume extra prizes; reloading keeps the pending pick and committed winners", () => {
  let state = transition(initialState(), "start", people, first);
  assert.deepEqual(transition(state, "start", people, first), state);
  const selected = state.pending;
  state = restoreState(JSON.stringify(state), people);
  assert.equal(state.phase, "standby");
  assert.deepEqual(transition(state, "start", people, () => 1).pending, selected);
  state = transition(state, "start", people, first);
  state = transition(state, "stop", people);
  assert.equal(state.history.length, 1);
  assert.deepEqual(transition(state, "stop", people), state);
  assert.equal(transition(state, "next", people), state);
  assert.equal(restoreState(JSON.stringify(state), people).phase, "winner");
  state = transition(state, "settled", people);
  state = transition(state, "next", people, first);
  assert.equal(state.phase, "spinning");
  assert.equal(state.history.length, 1);
  const resumed = restoreState(JSON.stringify(state), people);
  assert.equal(resumed.phase, "standby");
  assert.deepEqual(resumed.pending, state.pending);
});

test("incomplete or tampered state fails instead of silently resetting the event", () => {
  assert.throws(() => restoreState("{", people));
  assert.throws(() => restoreState(JSON.stringify({ history: [], phase: "winner" }), people));
  assert.throws(() => restoreState(JSON.stringify({ history: [], phase: "idle" }), people));
  const history = drawUntil(15);
  assert.throws(() => restoreState(JSON.stringify({ history: history.slice(0, 3), phase: "award" }), people));
  assert.equal(restoreState(JSON.stringify({ history, phase: "award" }), people).phase, "award");
  assert.throws(() => restoreState(JSON.stringify({ history: drawUntil(PRIZES.length), phase: "standby" }), people));
  history[1] = history[0];
  assert.throws(() => restoreState(JSON.stringify({ history, phase: "winner" }), people));
});

test("every digit and stagger stops forward at the exact digit with continuous initial velocity", () => {
  for (let index = 0; index < 3; index++) for (let digit = 0; digit < 10; digit++) {
    for (let start = 0; start < 20; start += 0.37) {
      const plan = stoppingPlan(start, digit, 2200 + index * 350);
      assert.ok(Math.abs(plan.end % 10 - digit) < 1e-9);
      assert.equal(stoppingPosition(plan, 0), start);
      assert.equal(stoppingPosition(plan, plan.duration), plan.end);
      assert.ok(Math.abs((stoppingPosition(plan, 0.001) - start) / 0.001 - SPEED) < 1e-6);
      let last = start;
      for (let t = 0; t <= plan.duration; t += 16.67) {
        const current = stoppingPosition(plan, t);
        assert.ok(current >= last && current <= plan.end + 1e-9);
        last = current;
      }
    }
  }
});
