// The sound of the river: its own music moods (easy by the water, a hush for the baptism, wide and bright when the heavens
// open), the soft rush of the river (the same noise bed the other scenes use for a crowd), and a few sounds for what
// happens: a splash, a dip under the water, a dove, a voice from heaven. It uses the same sound engine as Cana
// (lib/cana/sound.js), with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  come: mood(66, 0.3, 2, 9, 0.44),
  forbid: mood(60, 0.24, 3, 10, 0.42),
  baptized: mood(52, 0.18, 2, 8, 0.4),
  opened: mood(72, 0.42, 4, 13, 0.5),
  voice: mood(58, 0.3, 3, 12, 0.48)
};

export const MURMUR = { come: 0.03, forbid: 0.02, baptized: 0.012, opened: 0.015, voice: 0.01 };

// a burst of filtered noise that swells and fades: a splash or water running off
const swell = (ctx, out, t, freq, rise, len, level) => {
  const n = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, t);
  bp.Q.setValueAtTime(0.8, t);
  const g = ctx.createGain();
  envelope(g.gain, t, rise, level, len);
  n.connect(bp);
  bp.connect(g);
  g.connect(out);
  release(n, bp, g);
  n.start(t);
  n.stop(t + rise + len);
};

export const voices = {
  // a foot in the shallows: a soft splash
  splash(ctx, out, t) {
    swell(ctx, out, t, 2200, 0.01, 0.35, 0.1);
    swell(ctx, out, t + 0.12, 1500, 0.02, 0.3, 0.06);
  },
  // down under the water and up again: a long swell, then a bright spill
  dip(ctx, out, t) {
    swell(ctx, out, t, 900, 0.5, 0.8, 0.09);
    swell(ctx, out, t + 1.2, 2600, 0.01, 0.6, 0.11);
    tone(ctx, out, t + 1.3, 660, 0.05, 0.4);
  },
  // the dove: three soft bells falling, one after another
  dove(ctx, out, t) {
    [14, 11, 9].forEach((d, i) => bell(ctx, out, t + i * 0.45, degreeFreq(d), 0.1, 2.4));
  },
  // the voice from heaven: a low, open chord that stays a long while
  voice(ctx, out, t) {
    [0, 4, 7].forEach(d => bell(ctx, out, t, degreeFreq(d), 0.13, 4.2));
    bell(ctx, out, t + 0.6, degreeFreq(11), 0.08, 3.4);
  }
};

export const GAPS = { splash: 0.4, dip: 2, dove: 3, voice: 4 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
