// The sound of the upper room: its own music moods (hushed while it is made ready, warm as they gather, slow and still for the
// cup and the bread), the low murmur of a few voices, and a few sounds for what happens: a place laid, the cup poured, the
// bread broken, and bells for the remembering. It uses the same sound engine as Cana (lib/cana/sound.js), with this
// scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  prepare: mood(72, 0.36, 2, 9, 0.44),
  gather: mood(64, 0.3, 3, 10, 0.44),
  cup: mood(54, 0.22, 4, 11, 0.4),
  bread: mood(52, 0.2, 4, 11, 0.4),
  supper: mood(48, 0.18, 3, 10, 0.38)
};

export const MURMUR = { prepare: 0.02, gather: 0.03, cup: 0.015, bread: 0.012, supper: 0.01 };

// a burst of filtered noise that swells and fades: wine being poured
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
  // a plate set down on the cloth: a soft knock
  place(ctx, out, t) {
    tone(ctx, out, t, 220, 0.1, 0.1);
    tone(ctx, out, t + 0.05, 330, 0.05, 0.12);
  },
  // wine poured into a cup, and a small bell
  pour(ctx, out, t) {
    swell(ctx, out, t, 1800, 0.08, 0.35, 0.07);
    bell(ctx, out, t + 0.3, degreeFreq(9), 0.1, 1.6);
  },
  // bread broken: two dry taps
  brake(ctx, out, t) {
    tone(ctx, out, t, 180, 0.12, 0.06);
    tone(ctx, out, t + 0.09, 150, 0.1, 0.08);
  },
  // the light comes in: two soft bells, a step apart
  arrive(ctx, out, t) {
    [7, 11].forEach((d, i) => bell(ctx, out, t + i * 0.3, degreeFreq(d), 0.12, 2.2));
  },
  // "this do in remembrance of me": three slow bells
  remember(ctx, out, t) {
    [5, 9, 12].forEach((d, i) => bell(ctx, out, t + i * 0.5, degreeFreq(d), 0.12, 3));
  }
};

export const GAPS = { place: 0.4, pour: 0.5, brake: 0.5, arrive: 2, remember: 3 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
