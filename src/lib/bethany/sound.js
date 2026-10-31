// The sound of Bethany: its own music moods (low and slow at the grave, a rising lift as Lazarus comes out, warm and easy
// at the supper), the murmur of neighbours, and a few sounds for what happens: the stone rolled away, graveclothes loosed,
// the call "come forth", and ointment poured. It uses the same sound engine as Cana (lib/cana/sound.js), with this
// scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  grave: mood(50, 0.22, 0, 6, 0.4),
  stone: mood(56, 0.26, 1, 8, 0.42),
  forth: mood(82, 0.5, 3, 12, 0.5),
  supper: mood(72, 0.42, 2, 10, 0.46),
  anoint: mood(60, 0.3, 4, 11, 0.44)
};

export const MURMUR = { grave: 0.035, stone: 0.025, forth: 0.04, supper: 0.04, anoint: 0.02 };

// a burst of filtered noise that swells and fades: stone on stone, or cloth drawn away
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
  // a heavy stone rolled aside: a low rumble, then a dull knock
  stoneRoll(ctx, out, t) {
    swell(ctx, out, t, 180, 0.2, 1.1, 0.16);
    tone(ctx, out, t + 1.25, 90, 0.16, 0.25);
  },
  // graveclothes loosed: a soft swish and a small bell
  unwrap(ctx, out, t) {
    swell(ctx, out, t, 2200, 0.08, 0.35, 0.07);
    bell(ctx, out, t + 0.2, degreeFreq(9), 0.1, 1.6);
  },
  // the voice that calls him out: three bells climbing
  risen(ctx, out, t) {
    [4, 7, 11].forEach((d, i) => bell(ctx, out, t + i * 0.35, degreeFreq(d), 0.13, 2.4));
  },
  // ointment poured: a few soft drops, then a sweet bell
  anointing(ctx, out, t) {
    [0, 0.12, 0.26].forEach((dt, i) => tone(ctx, out, t + dt, 700 + i * 140, 0.07, 0.12));
    bell(ctx, out, t + 0.4, degreeFreq(11), 0.1, 2);
  }
};

export const GAPS = { stoneRoll: 2, unwrap: 0.8, risen: 2, anointing: 1 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
