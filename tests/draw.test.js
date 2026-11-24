import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PRIZES, THIRD_QUOTAS, getEligiblePool, selectDraw, validateParticipants } from "../src/logic/generatePrizeQueue.js";
import { initialState, transition, restoreState } from "../src/logic/drawState.js";
import { SPEED, stoppingPlan, stoppingPosition } from "../src/logic/reelMotion.js";

const people = JSON.parse(fs.readFileSync(new URL("../src/data/participants.json", import.meta.url)));
const first = () => 0;
function thirdHistory(choose = first) {
  const history = [];
  for (let i = 0; i < 15; i++) history.push(selectDraw(people, history, choose));
  return history;
}

test("72 unique tickets; all 15 group-two guests and exactly six special candidates", () => {
  validateParticipants(people);
  assert.equal(people.length, 72);
  assert.equal(new Set(people.map(p => p.number)).size, 72);
  const history = thirdHistory();
  assert.equal(getEligiblePool(people, history).length, 15);
  assert.equal(getEligiblePool(people, history).filter(p => p.region === "north").length, 3);
  history.push(selectDraw(people, history, first));
  history.push(selectDraw(people, history, first));
  const special = getEligiblePool(people, history);
  assert.equal(special.length, 6);
  assert.equal(special.filter(p => p.region === "central").length, 2);
  assert.equal(special.filter(p => p.region === "southeast").length, 4);
});

test("a Southwest second-prize winner excludes every remaining Southwest person from first prize", () => {
  const history = thirdHistory();
  const pool = getEligiblePool(people, history);
  history.push(selectDraw(people, history, () => pool.findIndex(p => p.region === "southwest")));
  const nextPool = getEligiblePool(people, history);
  assert.equal(nextPool.filter(p => p.region === "southwest").length, 0);
  assert.equal(nextPool.length, 12);
});

test("1000 seeded full draws always satisfy exact quotas, prize order and no repeat winners", () => {
  let seed = 2026;
  const choose = length => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 2 ** 32 * length); };
  for (let run = 0; run < 1000; run++) {
    const history = [];
    for (const prize of PRIZES) {
      const draw = selectDraw(people, history, choose);
      assert.equal(draw.prizeType, prize);
      history.push(draw);
    }
    assert.equal(new Set(history.map(d => d.participant.number)).size, 18);
    const counts = {};
    for (const draw of history.slice(0, 15)) counts[draw.participant.region] = (counts[draw.participant.region] || 0) + 1;
    assert.deepEqual(counts, THIRD_QUOTAS);
    assert.equal(history.slice(15, 17).filter(d => d.participant.region === "southwest").length <= 1, true);
    assert.equal(selectDraw(people, history), null);
  }
});

test("double clicks cannot consume extra prizes; reloading preserves pending and committed results", () => {
  let state = transition(initialState(), "start", people, first);
  assert.deepEqual(transition(state, "start", people, first), state);
  const selected = state.pending;
  state = restoreState(JSON.stringify(state), people);
  assert.deepEqual(transition(state, "start", people, () => 1).pending, selected);
  state = transition(state, "start", people, first);
  state = transition(state, "stop", people);
  assert.equal(state.history.length, 1);
  assert.deepEqual(transition(state, "stop", people), state);
  assert.equal(transition(state, "start", people), state);
  assert.equal(restoreState(JSON.stringify(state), people).phase, "winner");
  state = transition(state, "settled", people);
  state = transition(state, "next", people);
  assert.equal(state.phase, "idle");
  assert.equal(state.history.length, 1);
});

test("incomplete or tampered state fails instead of silently resetting the event", () => {
  assert.throws(() => restoreState("{", people));
  assert.throws(() => restoreState(JSON.stringify({ history: [], phase: "winner" }), people));
  const history = thirdHistory();
  history[1] = history[0];
  assert.throws(() => restoreState(JSON.stringify({ history, phase: "idle" }), people));
  assert.throws(() => validateParticipants(people.filter(p => p.region !== "chemicals")));
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
