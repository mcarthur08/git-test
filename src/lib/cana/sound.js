// The sound of the wedding at Cana, all made with the Web Audio API so there are no audio files to download or license:
// music from plucked strings and a timbrel (see music.js), the murmur of the guests, and small sounds for water being
// drawn and poured, the pots turning to wine, cups, cheers and footsteps. Nothing plays until the person has tapped
// something (the browser will not allow it), it stops when the tab is hidden, and it can be turned off.
import { MOODS, degreeFreq, melodyBar, mulberry } from "./music.js";

// ---- the voices: each makes one sound at time t, into `out` ----
const noiseBuffers = new WeakMap();
function noise(ctx) {
  if (!noiseBuffers.has(ctx)) {
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffers.set(ctx, buf);
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffers.get(ctx);
  src.loop = true;
  return src;
}

// a quick rise to `peak`, then a fall away over `decay` seconds
const envelope = (gain, t, attack, peak, decay) => {
  gain.setValueAtTime(0.0001, t);
  gain.linearRampToValueAtTime(peak, t + attack);
  gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
};

export function pluck(ctx, out, t, freq, vel = 0.5, len = 1.4) {
  const g = ctx.createGain();
  envelope(g.gain, t, 0.006, vel * 0.5, len);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(Math.min(8000, freq * 7), t);
  lp.frequency.exponentialRampToValueAtTime(freq * 2, t + len * 0.6);
  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(freq, t);
  const upper = ctx.createOscillator();
  upper.type = "sine";
  upper.frequency.setValueAtTime(freq * 2.003, t);
  const upperGain = ctx.createGain();
  upperGain.gain.setValueAtTime(0.25, t);
  body.connect(lp);
  upper.connect(upperGain);
  upperGain.connect(lp);
  lp.connect(g);
  g.connect(out);
  body.start(t);
  upper.start(t);
  body.stop(t + len + 0.1);
  upper.stop(t + len + 0.1);
}

export function drum(ctx, out, t, hit, vel = 0.5) {
  if (hit === "dum") {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(85, t + 0.14);
    const g = ctx.createGain();
    envelope(g.gain, t, 0.004, vel * 0.7, 0.18);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.3);
    return;
  }
  // a "tek": a short tap of noise with the jingle of the little cymbals above it
  [
    [4200, 1.2, 0.09, 0.9],
    [7500, 0.8, 0.16, 0.5]
  ].forEach(([f, q, decay, level]) => {
    const n = noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(f, t);
    bp.Q.setValueAtTime(q, t);
    const g = ctx.createGain();
    envelope(g.gain, t, 0.002, vel * 0.5 * level, decay);
    n.connect(bp);
    bp.connect(g);
    g.connect(out);
    n.start(t);
    n.stop(t + decay + 0.1);
  });
}

// a soft bell: a few partials, the higher ones dying away faster
export function bell(ctx, out, t, freq, vol = 0.2, decay = 2.2) {
  [
    [1, 1, decay],
    [2.76, 0.4, decay * 0.55],
    [5.4, 0.15, decay * 0.3]
  ].forEach(([ratio, level, d]) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * ratio, t);
    const g = ctx.createGain();
    envelope(g.gain, t, 0.004, vol * level, d);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + d + 0.1);
  });
}

function sweep(ctx, out, t, dur, from, to, peak, q = 1.2) {
  const n = noise(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.setValueAtTime(q, t);
  bp.frequency.setValueAtTime(from, t);
  bp.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + Math.min(0.08, dur / 3));
  g.gain.setValueAtTime(peak, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(bp);
  bp.connect(g);
  g.connect(out);
  n.start(t);
  n.stop(t + dur + 0.1);
}

// small round "bloops", like bubbles in water
function bubbles(ctx, out, t, dur, count, base = 380) {
  for (let k = 0; k < count; k++) {
    const at = t + (k / count) * dur;
    const f = base + ((k * 137) % 400);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(f, at);
    o.frequency.exponentialRampToValueAtTime(f * 1.6, at + 0.06);
    const g = ctx.createGain();
    envelope(g.gain, at, 0.004, 0.06, 0.07);
    o.connect(g);
    g.connect(out);
    o.start(at);
    o.stop(at + 0.14);
  }
}

export const voices = {
  step(ctx, out, t, vel = 0.5) {
    const n = noise(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(800, t);
    const g = ctx.createGain();
    envelope(g.gain, t, 0.002, vel * 0.9, 0.07);
    n.connect(lp);
    lp.connect(g);
    g.connect(out);
    n.start(t);
    n.stop(t + 0.12);
  },
  // water drawn from the cistern
  draw(ctx, out, t) {
    sweep(ctx, out, t, 0.7, 900, 330, 0.2);
    bubbles(ctx, out, t, 0.7, 5);
  },
  // water poured into a pot, rising in pitch as it fills
  pour(ctx, out, t, ms = 700) {
    const dur = ms / 1000;
    sweep(ctx, out, t, dur, 1300, 2600, 0.17, 1.6);
    bubbles(ctx, out, t, dur, 6, 520);
  },
  // a pot is full
  fillDone(ctx, out, t) {
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t + i * 0.05);
      const g = ctx.createGain();
      envelope(g.gain, t + i * 0.05, 0.003, 0.09, 0.28);
      o.connect(g);
      g.connect(out);
      o.start(t + i * 0.05);
      o.stop(t + i * 0.05 + 0.4);
    });
  },
  // a pot turns to wine: a chime, higher for each pot along the row
  wine(ctx, out, t, i = 0) {
    bell(ctx, out, t, degreeFreq(9 + i), 0.16, 1.6);
  },
  // two cups touching
  clink(ctx, out, t) {
    [
      [2100, 0, 0.18],
      [3100, 0.012, 0.12]
    ].forEach(([f, d, decay]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f, t + d);
      const g = ctx.createGain();
      envelope(g.gain, t + d, 0.002, 0.1, decay);
      o.connect(g);
      g.connect(out);
      o.start(t + d);
      o.stop(t + d + decay + 0.1);
    });
  },
  // the guests cheer: a swell of voices, with three rising chimes
  cheer(ctx, out, t) {
    const n = noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1100, t);
    bp.Q.setValueAtTime(0.6, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    n.connect(bp);
    bp.connect(g);
    g.connect(out);
    n.start(t);
    n.stop(t + 1.9);
    [7, 9, 11].forEach((d, i) => bell(ctx, out, t + 0.15 + i * 0.16, degreeFreq(d), 0.12, 1.4));
  },
  // a small friendly pop, for greeting someone
  blip(ctx, out, t) {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(780, t + 0.07);
    const g = ctx.createGain();
    envelope(g.gain, t, 0.004, 0.1, 0.12);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.2);
  },
  // a soft bell as each part of the story begins
  cue(ctx, out, t) {
    bell(ctx, out, t, degreeFreq(7), 0.18, 2.4);
  }
};

// how loud the murmur of the guests is in each part of the story
const MURMUR = { feast: 0.045, wineRuns: 0.03, fillJars: 0.038, drawOut: 0.038, celebrate: 0.08 };
// sounds that must not pile up if several people do the same thing at once: the least time between them, in seconds
const GAP = {
  step: 0.28,
  draw: 0.5,
  pour: 0.5,
  fillDone: 0.3,
  wine: 0.15,
  clink: 0.2,
  cheer: 2,
  blip: 0.4,
  cue: 1
};
const MASTER = 0.85;

// Plays one bar of the music from time `at`. Returns how long the bar lasts and the step the tune ended on.
export function playBar(ctx, out, mood, bar, prev, rand, at) {
  const half = 60 / mood.bpm / 2;
  const { events, last } = melodyBar(mood, bar, prev, rand);
  events.forEach(e => {
    const t = at + e.eighth * half;
    if (e.kind === "harp") {
      pluck(ctx, out, t, degreeFreq(e.degree), e.vel, Math.min(2.4, 0.5 + e.len * half * 1.6));
    } else {
      drum(ctx, out, t, e.hit, e.vel);
    }
  });
  return { span: 8 * half, last };
}

// A sound for no-one: used when the browser has no Web Audio, so the rest of the scene need not check.
const quiet = muted => {
  let m = muted;
  const none = () => {};
  return {
    unlock: none,
    phase: none,
    step: none,
    draw: none,
    pour: none,
    fillDone: none,
    wine: none,
    clink: none,
    cheer: none,
    blip: none,
    setMuted: v => {
      m = v;
    },
    isMuted: () => m,
    supported: false,
    destroy: none
  };
};

// Starts the sound. `Ctx` is the AudioContext to use (the browser's, unless one is given), and `muted` starts it silent.
export function createSound({
  Ctx = globalThis.AudioContext || globalThis.webkitAudioContext,
  muted = false,
  seed = 7
} = {}) {
  if (!Ctx) {
    return quiet(muted);
  }
  let ctx;
  try {
    ctx = new Ctx();
  } catch (err) {
    return quiet(muted);
  }
  let off = muted;
  const master = ctx.createGain();
  master.gain.setValueAtTime(off ? 0 : MASTER, ctx.currentTime);
  const squash = ctx.createDynamicsCompressor();
  master.connect(squash);
  squash.connect(ctx.destination);
  const musicBus = ctx.createGain();
  musicBus.gain.setValueAtTime(0.55, ctx.currentTime);
  musicBus.connect(master);
  const fxBus = ctx.createGain();
  fxBus.gain.setValueAtTime(0.9, ctx.currentTime);
  fxBus.connect(master);

  // the murmur of the guests: two bands of noise, each swelling and fading slowly
  const murmur = ctx.createGain();
  murmur.gain.setValueAtTime(0, ctx.currentTime);
  murmur.connect(musicBus);
  const murmurSources = [
    [500, 0.7, 0.23, 0.6],
    [950, 1, 0.17, 0.4]
  ].map(([f, q, rate, depth]) => {
    const n = noise(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(f, ctx.currentTime);
    bp.Q.setValueAtTime(q, ctx.currentTime);
    const layer = ctx.createGain();
    layer.gain.setValueAtTime(1 - depth / 2, ctx.currentTime);
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(rate, ctx.currentTime);
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.setValueAtTime(depth / 2, ctx.currentTime);
    lfo.connect(lfoDepth);
    lfoDepth.connect(layer.gain);
    n.connect(bp);
    bp.connect(layer);
    layer.connect(murmur);
    n.start(ctx.currentTime);
    lfo.start(ctx.currentTime);
    return [n, lfo];
  });

  const last = {};
  const sfx =
    name =>
    (...args) => {
      if (off || ctx.state !== "running") {
        return;
      }
      const now = ctx.currentTime;
      if (now - (last[name] ?? -99) < GAP[name]) {
        return;
      }
      last[name] = now;
      voices[name](ctx, fxBus, now + 0.01, ...args);
    };

  // the music: bars are scheduled a little ahead, so it keeps time however busy the page is
  let mood = MOODS.feast;
  let moodName = "feast";
  const rand = mulberry(seed);
  let bar = 0;
  let prev = 7;
  let nextBar = 0;
  const tick = () => {
    if (off || ctx.state !== "running") {
      return;
    }
    const now = ctx.currentTime;
    if (nextBar < now) {
      nextBar = now + 0.05;
    }
    while (nextBar < now + 0.7) {
      const played = playBar(ctx, musicBus, mood, bar++, prev, rand, nextBar);
      prev = played.last;
      nextBar += played.span;
    }
  };
  const timer = setInterval(tick, 150);

  const onVisible = () => {
    if (document.hidden) {
      ctx.suspend();
    } else if (!off) {
      ctx.resume();
    }
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisible);
  }

  return {
    supported: true,
    // call this from a tap or a key press: browsers only start sound after one
    unlock() {
      if (!off && ctx.state === "suspended") {
        ctx.resume();
      }
    },
    setMuted(v) {
      off = v;
      master.gain.setTargetAtTime(v ? 0 : MASTER, ctx.currentTime, 0.06);
      if (!v && ctx.state === "suspended") {
        ctx.resume();
      }
    },
    isMuted: () => off,
    // a new part of the story: the music takes its mood, the murmur changes and a bell sounds
    phase(name) {
      if (!MOODS[name]) {
        return;
      }
      const changed = name !== moodName;
      moodName = name;
      mood = MOODS[name];
      murmur.gain.setTargetAtTime(MURMUR[name], ctx.currentTime, 1.2);
      if (changed) {
        sfx("cue")();
      }
    },
    step: sfx("step"),
    draw: sfx("draw"),
    pour: sfx("pour"),
    fillDone: sfx("fillDone"),
    wine: sfx("wine"),
    clink: sfx("clink"),
    cheer: sfx("cheer"),
    blip: sfx("blip"),
    destroy() {
      clearInterval(timer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisible);
      }
      murmurSources.forEach(([n, lfo]) => {
        try {
          n.stop();
          lfo.stop();
        } catch (err) {
          // already stopped
        }
      });
      ctx.close();
    }
  };
}
