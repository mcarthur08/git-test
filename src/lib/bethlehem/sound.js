// The sound of the night: its own music moods (still in the field, a rising shimmer for the angel, bright for the host,
// quick on the road, warm at the end), the soft murmur of a few people (the same noise bed the other scenes use for a
// crowd), and a few sounds for what happens: the glory shining, the song of the host, a lamb's bleat, a chime at the
// manger. It uses the same sound engine as Cana (lib/cana/sound.js), with this scene's own settings.
import { degreeFreq } from "../cana/music.js";
import { bell, tone } from "../cana/sound.js";

const mood = (bpm, density, low, high, vel) => ({ bpm, density, low, high, vel, timbrel: false });

export const MOODS = {
  field: mood(54, 0.22, 1, 8, 0.38),
  angel: mood(62, 0.3, 5, 13, 0.46),
  host: mood(76, 0.5, 4, 14, 0.54),
  haste: mood(96, 0.55, 2, 11, 0.5),
  return: mood(70, 0.4, 3, 11, 0.46)
};

export const MURMUR = { field: 0.012, angel: 0.008, host: 0.01, haste: 0.02, return: 0.025 };

export const voices = {
  // the glory of the Lord shining: bells climbing a scale
  glory(ctx, out, t) {
    [7, 9, 11, 14].forEach((d, i) => bell(ctx, out, t + i * 0.22, degreeFreq(d), 0.1, 2.6));
  },
  // the song of the host: a chord of bells
  praise(ctx, out, t) {
    [7, 11, 14, 16].forEach((d, i) => bell(ctx, out, t + i * 0.06, degreeFreq(d), 0.09, 3));
  },
  // a lamb: two short, wavering notes
  baa(ctx, out, t) {
    tone(ctx, out, t, 330, 0.07, 0.22);
    tone(ctx, out, t + 0.16, 290, 0.07, 0.3);
  },
  // arriving at the manger: two low soft bells
  arrive(ctx, out, t) {
    [4, 7].forEach((d, i) => bell(ctx, out, t + i * 0.35, degreeFreq(d), 0.12, 2.8));
  }
};

export const GAPS = { glory: 3, praise: 2, baa: 0.6, arrive: 2 };

// what this scene gives to createSound
export const soundConfig = { moods: MOODS, murmurLevels: MURMUR, extra: voices, gaps: GAPS };
