// Walking the road: when you have read more days since you last looked at the map, your character walks the new
// stretch, pausing at each stop it reaches. This is the timing; the drawing is in views/Journey/useWalk.js.
import { STOPS } from "./data.js";
import { journeyPos } from "./journey.js";

// Where on the road (a fractional day count) the character was last drawn, kept per player.
export const seenKey = id => `nt70.walked.${id}`;

// The stops reached by going from `from` days to `to` days, in order (a stop is reached on its day).
export const stopsCrossed = (from, to) =>
  STOPS.map((s, i) => i).filter(i => STOPS[i].day > from && STOPS[i].day <= to);

const PAUSE_MS = 1100;
const MAX_PAUSES = 3;
const MAX_ROAD_MS = 5500;

// How long a stretch of road takes to walk: longer roads take longer, within limits.
export function legMs(a, b) {
  let dist = 0;
  let prev = journeyPos(a);
  for (let k = 1; k <= 24; k++) {
    const p = journeyPos(a + ((b - a) * k) / 24);
    dist += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return Math.round(Math.max(700, Math.min(2600, 500 + dist * 12)));
}

// The walk as a timeline: stretches of road, with a pause at each of the last few stops reached (earlier stops are
// walked straight past). Each step is { a, b, t0, t1 } for walking from day a to day b, with `stop` set on a pause.
export function walkPlan(from, to) {
  const crossed = stopsCrossed(from, to);
  const pausing = new Set(crossed.slice(-MAX_PAUSES));
  const goals = crossed.filter(i => pausing.has(i)).map(i => ({ day: STOPS[i].day, stop: i }));
  if (!goals.length || goals[goals.length - 1].day < to) {
    goals.push({ day: to, stop: null });
  }
  const legs = [];
  let a = from;
  goals.forEach(g => {
    if (g.day > a) {
      legs.push({ a, b: g.day, ms: legMs(a, g.day), stop: g.stop });
    } else if (g.stop !== null) {
      legs.push({ a, b: a, ms: 0, stop: g.stop });
    }
    a = g.day;
  });
  // a long walk is sped up, so it never takes more than a few seconds of road
  const road = legs.reduce((sum, l) => sum + l.ms, 0);
  const k = road > MAX_ROAD_MS ? MAX_ROAD_MS / road : 1;
  const steps = [];
  let t = 0;
  legs.forEach(l => {
    const ms = Math.round(l.ms * k);
    if (ms) {
      steps.push({ a: l.a, b: l.b, t0: t, t1: t + ms });
      t += ms;
    }
    if (l.stop !== null) {
      steps.push({ a: l.b, b: l.b, t0: t, t1: t + PAUSE_MS, stop: l.stop });
      t += PAUSE_MS;
    }
  });
  return { steps, total: t, crossed, paused: [...pausing] };
}

// Where along the road the character is `e` ms into a plan: { n, stop } with stop set while paused at one.
export function walkAt(plan, e) {
  const step = plan.steps.find(s => e < s.t1) || plan.steps[plan.steps.length - 1];
  if (!step) {
    return { n: 0, stop: null };
  }
  if (step.stop !== undefined) {
    return { n: step.b, stop: step.stop };
  }
  const u = Math.max(0, Math.min(1, (e - step.t0) / (step.t1 - step.t0)));
  const eased = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  return { n: step.a + (step.b - step.a) * eased, stop: null };
}
