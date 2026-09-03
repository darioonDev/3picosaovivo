/**
 * Deterministic PRNG (mulberry32) so generated mock series (history,
 * forecast) are stable across renders, tests and builds instead of
 * reshuffling on every request.
 */
export function createRng(seed: number) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInRange(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min);
}
