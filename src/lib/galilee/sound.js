// The sound of the boat: its own music moods (gentle at evening, tense in the storm, wide and still in the calm), the
// wind and sea (the same soft noise bed the other scenes use for a crowd, louder in the storm and almost gone in the calm),
// and a few sounds for what happens: a wave breaking, thunder, water bailed, the great calm. It uses the same sound engine
// as Cana (lib/cana/sound.js), with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  evening: mood(66, 0.3, 2, 9, 0.42),
  storm: mood(112, 0.7, 0, 6, 0.5),
  fear: mood(124, 0.75, 0, 5, 0.52),
  calm: mood(48, 0.18, 5, 12, 0.38),
  marvel: mood(60, 0.28, 3, 11, 0.42)
};

export const MURMUR = { evening: 0.02, storm: 0.1, fear: 0.13, calm: 0.004, marvel: 0.012 };

// a burst of filtered noise that swells and fades: spray, wind or thunder depending on its pitch and length
const swell = (ctx, out, t, freq, rise, len, level) => {
  const n = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, t);
  bp.Q.setValueAtTime(0.7, t);
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
  // a wave breaking against the boat
  wave(ctx, out, t) {
    swell(ctx, out, t, 700, 0.12, 0.6, 0.12);
    tone(ctx, out, t + 0.05, 90, 0.1, 0.2);
  },
  // thunder: a long low rumble
  thunder(ctx, out, t) {
    swell(ctx, out, t, 140, 0.1, 1.6, 0.2);
    tone(ctx, out, t, 55, 0.2, 1.2);
  },
  // water thrown over the side
  splash(ctx, out, t) {
    swell(ctx, out, t, 2200, 0.01, 0.22, 0.09);
  },
  // "Peace, be still": a deep note, then bells settling slowly down
  hush(ctx, out, t) {
    tone(ctx, out, t, 110, 0.14, 2.4);
    [14, 11, 9, 7].forEach((d, i) => bell(ctx, out, t + 0.4 + i * 0.5, degreeFreq(d), 0.1, 2.6));
  }
};

export const GAPS = { wave: 0.7, thunder: 3, splash: 0.15, hush: 4 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
