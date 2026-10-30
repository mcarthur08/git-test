// The sound of the shore: its own music moods (easy by the water, a rising call, and a steady walking pace at the end), the
// soft wash of the sea (the same noise bed the other scenes use for a crowd), and a few sounds for what happens: a net
// cast, a catch, a net mended. It uses the same sound engine as Cana (lib/cana/sound.js), with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  shore: mood(68, 0.32, 2, 9, 0.44),
  call: mood(58, 0.24, 4, 11, 0.42),
  boat: mood(74, 0.4, 2, 10, 0.46),
  leave: mood(92, 0.55, 3, 12, 0.52)
};

export const MURMUR = { shore: 0.03, call: 0.015, boat: 0.03, leave: 0.025 };

// a burst of filtered noise that swells and fades: a splash or a rope drawn through the hands
const swell = (ctx, out, t, freq, rise, len, level) => {
  const n = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, t);
  bp.Q.setValueAtTime(0.8, t);
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
  // a net flung out over the water: a whoosh, then a soft splash
  cast(ctx, out, t) {
    swell(ctx, out, t, 1400, 0.1, 0.25, 0.08);
    swell(ctx, out, t + 0.28, 2400, 0.01, 0.3, 0.1);
  },
  // a catch of fish: two bright flicks
  catchFish(ctx, out, t) {
    tone(ctx, out, t, 880, 0.08, 0.15);
    tone(ctx, out, t + 0.08, 1320, 0.08, 0.2);
  },
  // a net mended: a small tap and a bell
  mended(ctx, out, t) {
    tone(ctx, out, t, 240, 0.1, 0.08);
    bell(ctx, out, t + 0.1, degreeFreq(9), 0.1, 1.6);
  },
  // the call: two soft bells, a step apart
  follow(ctx, out, t) {
    [7, 11].forEach((d, i) => bell(ctx, out, t + i * 0.3, degreeFreq(d), 0.12, 2.2));
  }
};

export const GAPS = { cast: 0.5, catchFish: 0.3, mended: 0.4, follow: 2 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
