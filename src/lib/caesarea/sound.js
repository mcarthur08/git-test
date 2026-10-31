// The sound of the cliffs: its own music moods (open and curious at first, a hush for the question, a bright lift for the
// confession), the soft run of the spring (the same noise bed the other scenes use for a crowd), and a few sounds for what
// happens: a drink from the spring, a stone laid, the confession, and the jingle of the keys. It uses the same sound engine
// as Cana (lib/cana/sound.js), with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  ask: mood(70, 0.3, 2, 9, 0.42),
  say: mood(76, 0.38, 3, 10, 0.44),
  confess: mood(56, 0.22, 4, 11, 0.4),
  rock: mood(84, 0.5, 2, 12, 0.5),
  keys: mood(94, 0.56, 3, 13, 0.54)
};

export const MURMUR = { ask: 0.03, say: 0.03, confess: 0.012, rock: 0.025, keys: 0.025 };

// a burst of filtered noise that swells and fades: running water
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
  // a drink from the spring: a cool rush and two drops
  drink(ctx, out, t) {
    swell(ctx, out, t, 2200, 0.08, 0.35, 0.07);
    tone(ctx, out, t + 0.3, 1568, 0.05, 0.1);
    tone(ctx, out, t + 0.42, 1175, 0.05, 0.12);
  },
  // a stone set on the rock: a low knock and a short bell
  stone(ctx, out, t) {
    tone(ctx, out, t, 130, 0.14, 0.12);
    bell(ctx, out, t + 0.08, degreeFreq(6), 0.08, 1.2);
  },
  // the confession: two soft bells, a step apart
  confess(ctx, out, t) {
    [7, 11].forEach((d, i) => bell(ctx, out, t + i * 0.3, degreeFreq(d), 0.12, 2.4));
  },
  // the keys: a bright shimmer of small bells
  keys(ctx, out, t) {
    [12, 14, 13, 16].forEach((d, i) => bell(ctx, out, t + i * 0.09, degreeFreq(d), 0.07, 1.8));
  }
};

export const GAPS = { drink: 0.6, stone: 0.4, confess: 2, keys: 2 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
