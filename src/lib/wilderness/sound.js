// The sound of the wilderness: its own music moods (thin and bare, a low unsettled one while he is tempted, and a bright one
// when the angels come), the soft wind (the same noise bed the other scenes use for a crowd), and a few sounds for what
// happens: a stone picked up, a prayer, an answer from Scripture, the angels. It uses the same sound engine as Cana
// (lib/cana/sound.js), with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  fast: mood(56, 0.22, 0, 7, 0.4),
  stones: mood(52, 0.2, 0, 6, 0.38),
  pinnacle: mood(54, 0.22, 1, 8, 0.4),
  mountain: mood(58, 0.26, 2, 10, 0.42),
  angels: mood(80, 0.5, 4, 13, 0.5)
};

export const MURMUR = { fast: 0.012, stones: 0.01, pinnacle: 0.01, mountain: 0.012, angels: 0.02 };

export const voices = {
  // a stone lifted and set down: two dry knocks
  stone(ctx, out, t) {
    tone(ctx, out, t, 190, 0.12, 0.07);
    tone(ctx, out, t + 0.09, 270, 0.1, 0.06);
  },
  // a prayer: one long soft bell
  pray(ctx, out, t) {
    bell(ctx, out, t, degreeFreq(4), 0.1, 2.8);
  },
  // "It is written": two bells, a step apart, rising
  scripture(ctx, out, t) {
    [7, 11].forEach((d, i) => bell(ctx, out, t + i * 0.28, degreeFreq(d), 0.13, 2.4));
  },
  // the angels: a run of bells going up
  angels(ctx, out, t) {
    [5, 8, 10, 12].forEach((d, i) => bell(ctx, out, t + i * 0.22, degreeFreq(d), 0.1, 2.6));
  }
};

export const GAPS = { stone: 0.3, pray: 1.5, scripture: 2, angels: 4 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
