// The sound of the hillside: its own music moods (hushed while the bread is blessed, brighter as the baskets are
// gathered), the murmur of the crowd, and a few sounds for what happens: the blessing, the bread broken, baskets set
// down and picked up. It uses the same sound engine as Cana (lib/cana/sound.js), with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone, noise, release, envelope } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  day: mood(70, 0.35, 2, 9, 0.45),
  give: mood(64, 0.3, 0, 7, 0.42),
  sit: mood(76, 0.4, 2, 9, 0.46),
  bless: mood(54, 0.2, 4, 11, 0.4),
  feed: mood(88, 0.55, 2, 10, 0.5),
  gather: mood(98, 0.62, 4, 12, 0.55)
};

// the crowd's murmur is loud in the day and hushed for the blessing
export const MURMUR = {
  day: 0.05,
  give: 0.035,
  sit: 0.05,
  bless: 0.012,
  feed: 0.055,
  gather: 0.05
};

export const voices = {
  // the blessing: four soft bells, one after the other
  bless(ctx, out, t) {
    [7, 9, 11, 14].forEach((d, i) => bell(ctx, out, t + i * 0.22, degreeFreq(d), 0.12, 2.2));
  },
  // bread broken: a short crack of noise over a low tap
  breadBreak(ctx, out, t) {
    const n = noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1800, t);
    bp.Q.setValueAtTime(1.4, t);
    const g = ctx.createGain();
    envelope(g.gain, t, 0.002, 0.18, 0.07);
    n.connect(bp);
    bp.connect(g);
    g.connect(out);
    release(n, bp, g);
    n.start(t);
    n.stop(t + 0.15);
    tone(ctx, out, t, 150, 0.08, 0.08);
  },
  // a basket set down
  thud(ctx, out, t) {
    tone(ctx, out, t, 130, 0.14, 0.14);
    tone(ctx, out, t + 0.01, 95, 0.1, 0.12);
  },
  // a basket picked up: two notes rising
  pickUp(ctx, out, t) {
    tone(ctx, out, t, 660, 0.08, 0.18);
    tone(ctx, out, t + 0.07, 990, 0.08, 0.22);
  }
};

export const GAPS = { bless: 2, breadBreak: 0.25, thud: 0.2, pickUp: 0.2 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
