// The music for the wedding at Cana: a few plucked strings, and a timbrel for the dancing, in a scale with the
// flavour of the region (D, E flat, F sharp, G, A, B flat, C). Each part of the story has its own mood: slow and
// thin while the wine runs out, steady while the servants work, shimmering as the water turns, lively for the dance.
// This is only the notes. The sounds themselves are made in sound.js.
export const ROOT = 146.83; // D3
export const SCALE = [0, 1, 4, 5, 7, 8, 10];

// The pitch of a step on the scale (step 0 is the root, step 7 the root an octave up, and so on).
export const degreeFreq = d => {
  const octave = Math.floor(d / 7);
  const i = ((d % 7) + 7) % 7;
  return ROOT * 2 ** ((SCALE[i] + 12 * octave) / 12);
};

// bpm is beats a minute, density how busy the tune is (0 to 1), low and high the range of steps it stays in,
// vel how loud it plays, and timbrel whether the drum plays.
export const MOODS = {
  feast: { bpm: 76, density: 0.42, low: 2, high: 9, vel: 0.5, timbrel: false },
  wineRuns: { bpm: 64, density: 0.3, low: 0, high: 7, vel: 0.42, timbrel: false },
  fillJars: { bpm: 84, density: 0.5, low: 2, high: 9, vel: 0.5, timbrel: false },
  drawOut: { bpm: 70, density: 0.6, low: 4, high: 12, vel: 0.5, timbrel: false },
  celebrate: { bpm: 118, density: 0.72, low: 2, high: 11, vel: 0.62, timbrel: true }
};

export const mulberry = seed => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// How likely a note is on each of the eight half-beats of a bar: the strong beats are favoured.
const WEIGHT = [1, 0.45, 0.8, 0.45, 0.9, 0.45, 0.8, 0.55];
const STEPS = [-3, -2, -1, -1, 0, 1, 1, 2, 3];
// the drum: a low "dum" and a lighter "tek" on the half-beats
const DRUM = [
  [0, "dum"],
  [2, "tek"],
  [3, "dum"],
  [4, "tek"],
  [6, "tek"]
];

// One bar (eight half-beats) of music. `prev` is the step the tune was last on; the result carries on from there.
// Every fourth bar ends the phrase by coming home to the root. Returns { events, last } where an event is
// { eighth, kind: "harp", degree, len, vel } or { eighth, kind: "drum", hit: "dum" | "tek", vel }.
export function melodyBar(mood, bar, prev, rand) {
  const events = [];
  let at = Math.max(mood.low, Math.min(mood.high, prev));
  const endOfPhrase = bar % 4 === 3;
  let lastNote = -1;
  for (let i = 0; i < 8; i++) {
    const p = mood.density * WEIGHT[i] + (i === 0 && bar % 2 === 0 ? 0.35 : 0);
    if (rand() < p) {
      at = Math.max(mood.low, Math.min(mood.high, at + STEPS[Math.floor(rand() * STEPS.length)]));
      events.push({
        eighth: i,
        kind: "harp",
        degree: at,
        len: 1 + Math.floor(rand() * 3),
        vel: +(mood.vel * (0.7 + rand() * 0.3) * (i % 2 ? 0.85 : 1)).toFixed(3)
      });
      lastNote = events.length - 1;
    }
  }
  if (endOfPhrase) {
    // the last note of the phrase settles on the root, in whichever octave in range is nearest
    const homes = [0, 7, 14].filter(d => d >= mood.low && d <= mood.high);
    const root = homes.sort((x, y) => Math.abs(x - at) - Math.abs(y - at))[0] ?? at;
    if (lastNote >= 0) {
      events[lastNote].degree = root;
    } else {
      events.push({ eighth: 6, kind: "harp", degree: root, len: 2, vel: mood.vel });
    }
    at = root;
  }
  if (mood.timbrel) {
    DRUM.forEach(([eighth, hit]) => {
      events.push({ eighth, kind: "drum", hit, vel: hit === "dum" ? 0.55 : 0.32 });
    });
  }
  return { events, last: at };
}
