// The sound of the street: its own music moods (busy as the crowd waits, hushed as he is called, warm when the poor are
// given to), the murmur of the crowd (loud in the press, and in the murmuring), and a few sounds for what happens: leaves
// rustling as he climbs, his name being called, and coins. It uses the same sound engine as Cana (lib/cana/sound.js), with
// this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  street: mood(80, 0.4, 2, 9, 0.46),
  press: mood(96, 0.6, 1, 8, 0.5),
  climb: mood(88, 0.5, 3, 10, 0.48),
  called: mood(56, 0.22, 5, 12, 0.4),
  murmur: mood(72, 0.35, 0, 7, 0.42),
  restore: mood(94, 0.6, 3, 12, 0.54)
};

export const MURMUR = {
  street: 0.05,
  press: 0.075,
  climb: 0.05,
  called: 0.012,
  murmur: 0.08,
  restore: 0.04
};

export const voices = {
  // leaves rustling as someone climbs: a short soft swell of high noise
  rustle(ctx, out, t) {
    const n = noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(3200, t);
    bp.Q.setValueAtTime(0.8, t);
    const g = ctx.createGain();
    envelope(g.gain, t, 0.08, 0.5, 0.07);
    n.connect(bp);
    bp.connect(g);
    g.connect(out);
    release(n, bp, g);
    n.start(t);
    n.stop(t + 0.6);
  },
  // his name called: three warm bells rising
  call(ctx, out, t) {
    [4, 7, 9].forEach((d, i) => bell(ctx, out, t + i * 0.26, degreeFreq(d), 0.13, 2.2));
  },
  // a coin: a bright ping and its echo
  coin(ctx, out, t) {
    tone(ctx, out, t, 1568, 0.08, 0.3);
    tone(ctx, out, t + 0.07, 2093, 0.07, 0.35);
  }
};

export const GAPS = { rustle: 0.5, call: 3, coin: 0.12 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
