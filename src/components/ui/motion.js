// Meters and counters animate from the last value they showed, even after the tab was left and reopened.
export const prevVals = {};
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
