export const SPEED = 0.01; // digits per millisecond
export const ACCELERATION_MS = 450;
export function spinDistance(elapsed) {
  const t = Math.max(0, elapsed);
  return t < ACCELERATION_MS
    ? SPEED * t * t / (2 * ACCELERATION_MS)
    : SPEED * (t - ACCELERATION_MS / 2);
}
export function stoppingPlan(position, target, duration) {
  const end = target + 10 * Math.ceil((position + SPEED * duration / 2 - target) / 10);
  return { start: position, end, duration };
}
export function stoppingPosition(plan, elapsed) {
  const t = Math.max(0, Math.min(1, elapsed / plan.duration));
  const d = plan.end - plan.start, velocity = SPEED * plan.duration;
  return plan.start + (t ** 3 - 2 * t ** 2 + t) * velocity + (-2 * t ** 3 + 3 * t ** 2) * d;
}
