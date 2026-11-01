// The sound of the well: its own music moods (still in the heat, a gentle rising for the living water, brisk when the
// woman runs to the town, and glad at the end), a hush of people, and a few sounds for what happens: the bucket let down
// and drawn up, water poured, the call of the living water, a waterpot set down. It uses the same sound engine as Cana
// (lib/cana/sound.js), with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  road: mood(76, 0.34, 2, 9, 0.44),
  well: mood(60, 0.26, 3, 10, 0.42),
  living: mood(54, 0.22, 4, 12, 0.42),
  tell: mood(96, 0.5, 3, 12, 0.5),
  believe: mood(84, 0.5, 3, 13, 0.52)
};

export const MURMUR = { road: 0.015, well: 0.02, living: 0.01, tell: 0.03, believe: 0.04 };

// a burst of filtered noise that swells and fades: water poured or a rope drawn through the hands
const swell = (ctx, out, t, freq, rise, len, level) => {
  const n = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, t);
  bp.Q.setValueAtTime(0.9, t);
  const g = ctx.createGain();
  envelope(g.gain, t, rise, len, level);
  n.connect(bp);
  bp.connect(g);
  g.connect(out);
  release(n, bp, g);
  n.start(t);
  n.stop(t + rise + len);
};

export const voices = {
  // the bucket drawn up: a creak of the rope, then a splash and a drip
  draw(ctx, out, t) {
    swell(ctx, out, t, 500, 0.2, 0.5, 0.05);
    swell(ctx, out, t + 0.6, 2200, 0.01, 0.3, 0.09);
    tone(ctx, out, t + 0.95, 1560, 0.05, 0.12);
  },
  // water poured into a cup: a soft trickle and a bell
  pour(ctx, out, t) {
    swell(ctx, out, t, 3000, 0.05, 0.4, 0.07);
    bell(ctx, out, t + 0.3, degreeFreq(9), 0.09, 1.4);
  },
  // living water: three soft bells, rising
  living(ctx, out, t) {
    [6, 9, 13].forEach((d, i) => bell(ctx, out, t + i * 0.28, degreeFreq(d), 0.12, 2.4));
  },
  // the waterpot set down: a dull knock
  setDown(ctx, out, t) {
    tone(ctx, out, t, 180, 0.12, 0.1);
    tone(ctx, out, t + 0.1, 140, 0.08, 0.12);
  }
};

export const GAPS = { draw: 1.2, pour: 0.6, living: 2, setDown: 0.5 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
