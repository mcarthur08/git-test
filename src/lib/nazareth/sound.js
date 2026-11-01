// The sound of Nazareth: its own music moods (easy at the workshop, a brisk travelling pace, a worried search, the quiet of
// the temple court, and a warm homecoming), a soft murmur of the village, and a few sounds for what happens: a board
// planed, a bundle tied, a call to look for him, and the finding. It uses the same sound engine as Cana (lib/cana/sound.js),
// with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  home: mood(70, 0.34, 2, 9, 0.44),
  feast: mood(96, 0.55, 3, 12, 0.52),
  lost: mood(62, 0.26, 2, 8, 0.4),
  found: mood(54, 0.22, 4, 11, 0.4),
  grow: mood(76, 0.42, 2, 10, 0.46)
};

export const MURMUR = { home: 0.03, feast: 0.045, lost: 0.025, found: 0.015, grow: 0.03 };

// a rasp of filtered noise: a plane drawn along a board
const rasp = (ctx, out, t, freq, len, level) => {
  const n = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(freq, t);
  bp.Q.setValueAtTime(1.2, t);
  const g = ctx.createGain();
  envelope(g.gain, t, 0.03, len, level);
  n.connect(bp);
  bp.connect(g);
  g.connect(out);
  release(n, bp, g);
  n.start(t);
  n.stop(t + 0.03 + len);
};

export const voices = {
  // a board planed: two long rasps and a knock
  plane(ctx, out, t) {
    rasp(ctx, out, t, 3200, 0.22, 0.07);
    rasp(ctx, out, t + 0.3, 2800, 0.22, 0.07);
    tone(ctx, out, t + 0.62, 200, 0.08, 0.07);
  },
  // a bundle tied up: a soft tap and a small bell
  tie(ctx, out, t) {
    tone(ctx, out, t, 260, 0.09, 0.07);
    bell(ctx, out, t + 0.1, degreeFreq(8), 0.09, 1.4);
  },
  // a call along the road: two bells, a step down
  calling(ctx, out, t) {
    [9, 6].forEach((d, i) => bell(ctx, out, t + i * 0.35, degreeFreq(d), 0.1, 1.8));
  },
  // the finding: three warm bells going up
  found(ctx, out, t) {
    [4, 7, 11].forEach((d, i) => bell(ctx, out, t + i * 0.28, degreeFreq(d), 0.12, 2.4));
  }
};

export const GAPS = { plane: 0.6, tie: 0.4, calling: 1.2, found: 2 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
