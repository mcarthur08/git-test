import { describe, it, expect, vi, afterEach } from "vitest";
import { ROOT, SCALE, MOODS, degreeFreq, melodyBar, mulberry } from "./music.js";
import { createSound, voices } from "./sound.js";
import { PHASES } from "./story.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the music", () => {
  const bars = (mood, n = 64, seed = 3) => {
    const rand = mulberry(seed);
    let prev = 7;
    const out = [];
    for (let b = 0; b < n; b++) {
      const r = melodyBar(MOODS[mood], b, prev, rand);
      prev = r.last;
      out.push(r.events);
    }
    return out;
  };

  it("is on a scale of D, E flat, F sharp, G, A, B flat and C", () => {
    expect(ROOT).toBeCloseTo(146.83, 2);
    expect(SCALE).toEqual([0, 1, 4, 5, 7, 8, 10]);
    expect(degreeFreq(0)).toBeCloseTo(ROOT, 6);
    expect(degreeFreq(7)).toBeCloseTo(ROOT * 2, 6);
    expect(degreeFreq(14)).toBeCloseTo(ROOT * 4, 6);
    expect(degreeFreq(4)).toBeCloseTo(ROOT * 2 ** (7 / 12), 6);
    expect(degreeFreq(-7)).toBeCloseTo(ROOT / 2, 6);
    // every step up is a higher note
    for (let d = -3; d < 20; d++) {
      expect(degreeFreq(d + 1)).toBeGreaterThan(degreeFreq(d));
    }
  });

  it("has a mood for every part of the story", () => {
    PHASES.forEach(p => {
      const m = MOODS[p];
      expect(m, p).toBeTruthy();
      expect(m.bpm).toBeGreaterThan(40);
      expect(m.bpm).toBeLessThan(160);
      expect(m.density).toBeGreaterThan(0);
      expect(m.density).toBeLessThanOrEqual(1);
      expect(m.low).toBeLessThan(m.high);
    });
  });

  it("is the same every time for the same seed, and different for another", () => {
    expect(bars("feast", 16, 1)).toEqual(bars("feast", 16, 1));
    expect(bars("feast", 16, 1)).not.toEqual(bars("feast", 16, 2));
  });

  it("only plays notes in range, inside the bar, with a sensible length and loudness", () => {
    PHASES.forEach(p => {
      const m = MOODS[p];
      bars(p).forEach(events =>
        events.forEach(e => {
          expect(e.eighth).toBeGreaterThanOrEqual(0);
          expect(e.eighth).toBeLessThan(8);
          expect(e.vel).toBeGreaterThan(0);
          expect(e.vel).toBeLessThanOrEqual(1);
          if (e.kind === "harp") {
            expect(e.degree, p).toBeGreaterThanOrEqual(m.low);
            expect(e.degree, p).toBeLessThanOrEqual(m.high);
            expect(Number.isInteger(e.degree)).toBe(true);
            expect(e.len).toBeGreaterThanOrEqual(1);
            expect(e.len).toBeLessThanOrEqual(3);
            expect(Number.isFinite(degreeFreq(e.degree))).toBe(true);
          }
        })
      );
    });
  });

  it("ends every fourth bar by coming home to the root", () => {
    PHASES.forEach(p => {
      bars(p).forEach((events, b) => {
        if (b % 4 === 3) {
          const harp = events.filter(e => e.kind === "harp");
          expect(harp.length, `${p} bar ${b}`).toBeGreaterThan(0);
          expect(harp[harp.length - 1].degree % 7, `${p} bar ${b}`).toBe(0);
        }
      });
    });
  });

  it("is busier and quicker for the dance than while the wine runs out", () => {
    const notes = mood =>
      bars(mood)
        .flat()
        .filter(e => e.kind === "harp").length;
    expect(notes("celebrate")).toBeGreaterThan(notes("wineRuns"));
    expect(MOODS.celebrate.bpm).toBeGreaterThan(MOODS.wineRuns.bpm);
    expect(MOODS.celebrate.bpm).toBeGreaterThan(MOODS.feast.bpm);
  });

  it("plays the drum only for the dance", () => {
    PHASES.forEach(p => {
      const drums = bars(p, 8)
        .flat()
        .filter(e => e.kind === "drum");
      if (p === "celebrate") {
        expect(drums.length).toBeGreaterThan(0);
        expect(drums.every(d => d.hit === "dum" || d.hit === "tek")).toBe(true);
      } else {
        expect(drums.length, p).toBe(0);
      }
    });
  });

  it("never plays more than one string and one drum at the same moment, so it cannot pile up", () => {
    PHASES.forEach(p =>
      bars(p).forEach(events => {
        for (let e = 0; e < 8; e++) {
          const now = events.filter(x => x.eighth === e);
          expect(now.filter(x => x.kind === "harp").length, p).toBeLessThanOrEqual(1);
          expect(now.filter(x => x.kind === "drum").length, p).toBeLessThanOrEqual(1);
          expect(now.reduce((sum, x) => sum + x.vel, 0)).toBeLessThan(1.3);
        }
      })
    );
  });
});

// A pretend AudioContext that records what is made, so the sound can be tested without a speaker.
function fakeAudio() {
  const log = { nodes: 0, started: 0, closed: false, resumed: 0, suspended: 0, targets: [] };
  const param = () => ({
    value: 0,
    setValueAtTime() {
      return this;
    },
    linearRampToValueAtTime() {
      return this;
    },
    exponentialRampToValueAtTime() {
      return this;
    },
    setTargetAtTime(v) {
      log.targets.push(v);
      return this;
    },
    cancelScheduledValues() {
      return this;
    }
  });
  const node = extra => {
    log.nodes++;
    return {
      connect: x => x,
      disconnect() {},
      start() {
        log.started++;
      },
      stop() {},
      ...extra
    };
  };
  class Ctx {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 44100;
      this.state = "suspended";
      this.destination = {};
      log.ctx = this;
    }
    createGain() {
      return node({ gain: param() });
    }
    createOscillator() {
      return node({ frequency: param(), type: "sine" });
    }
    createBiquadFilter() {
      return node({ frequency: param(), Q: param(), type: "lowpass" });
    }
    createDynamicsCompressor() {
      return node({});
    }
    createBufferSource() {
      return node({ buffer: null, loop: false });
    }
    createBuffer(_c, len) {
      return { getChannelData: () => new Float32Array(len) };
    }
    resume() {
      log.resumed++;
      this.state = "running";
      return Promise.resolve();
    }
    suspend() {
      log.suspended++;
      this.state = "suspended";
      return Promise.resolve();
    }
    close() {
      log.closed = true;
      this.state = "closed";
      return Promise.resolve();
    }
  }
  return { Ctx, log };
}

describe("the sound", () => {
  it("is silent, and safe to call, when the browser has no Web Audio", () => {
    const s = createSound({ Ctx: null, muted: false });
    expect(s.supported).toBe(false);
    [
      "unlock",
      "phase",
      "step",
      "draw",
      "pour",
      "fillDone",
      "wine",
      "clink",
      "cheer",
      "blip",
      "destroy"
    ].forEach(m => expect(() => s[m](1)).not.toThrow());
    expect(s.isMuted()).toBe(false);
    s.setMuted(true);
    expect(s.isMuted()).toBe(true);
  });

  it("is silent when the browser will not make an audio context", () => {
    const Broken = function () {
      throw new Error("not allowed");
    };
    expect(createSound({ Ctx: Broken }).supported).toBe(false);
  });

  it("makes nothing until it is unlocked by a tap, then starts", () => {
    vi.useFakeTimers();
    const { Ctx, log } = fakeAudio();
    const s = createSound({ Ctx });
    const before = log.nodes;
    s.draw();
    vi.advanceTimersByTime(600);
    expect(log.nodes).toBe(before);
    s.unlock();
    expect(log.resumed).toBe(1);
    vi.advanceTimersByTime(300);
    expect(log.nodes).toBeGreaterThan(before);
    s.destroy();
  });

  it("plays every sound it has without a problem", () => {
    vi.useFakeTimers();
    const { Ctx, log } = fakeAudio();
    const s = createSound({ Ctx });
    s.unlock();
    PHASES.forEach(p => {
      log.ctx.currentTime += 3;
      expect(() => s.phase(p)).not.toThrow();
      vi.advanceTimersByTime(200);
    });
    ["step", "draw", "pour", "fillDone", "wine", "clink", "cheer", "blip"].forEach(name => {
      log.ctx.currentTime += 3;
      const before = log.nodes;
      expect(() => s[name](2)).not.toThrow();
      expect(log.nodes, name).toBeGreaterThan(before);
    });
    s.destroy();
  });

  it("does not let the same sound pile up when several people do it at once", () => {
    vi.useFakeTimers();
    const { Ctx, log } = fakeAudio();
    const s = createSound({ Ctx });
    s.unlock();
    log.ctx.currentTime = 5;
    s.step();
    const once = log.nodes;
    s.step();
    s.step();
    expect(log.nodes).toBe(once);
    log.ctx.currentTime += 0.5;
    s.step();
    expect(log.nodes).toBeGreaterThan(once);
    s.destroy();
  });

  it("stops making music and sounds when muted, and carries on when turned back on", () => {
    vi.useFakeTimers();
    const { Ctx, log } = fakeAudio();
    const s = createSound({ Ctx });
    s.unlock();
    log.ctx.currentTime = 10;
    vi.advanceTimersByTime(300);
    s.setMuted(true);
    expect(log.targets).toContain(0);
    const quiet = log.nodes;
    log.ctx.currentTime += 20;
    vi.advanceTimersByTime(2000);
    s.draw();
    s.cheer();
    expect(log.nodes).toBe(quiet);
    s.setMuted(false);
    expect(s.isMuted()).toBe(false);
    log.ctx.currentTime += 20;
    vi.advanceTimersByTime(300);
    expect(log.nodes).toBeGreaterThan(quiet);
    s.destroy();
  });

  it("can start muted, and stays quiet until turned on", () => {
    vi.useFakeTimers();
    const { Ctx, log } = fakeAudio();
    const s = createSound({ Ctx, muted: true });
    expect(s.isMuted()).toBe(true);
    s.unlock();
    expect(log.resumed).toBe(0);
    const before = log.nodes;
    log.ctx.currentTime = 4;
    vi.advanceTimersByTime(1000);
    s.cheer();
    expect(log.nodes).toBe(before);
    s.setMuted(false);
    expect(log.resumed).toBe(1);
    s.destroy();
  });

  it("pauses when the page is hidden and carries on when it is back", () => {
    vi.useFakeTimers();
    const { Ctx, log } = fakeAudio();
    const s = createSound({ Ctx });
    s.unlock();
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(log.suspended).toBe(1);
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(log.resumed).toBe(2);
    s.destroy();
  });

  it("takes the mood of each part of the story and ignores a part it does not know", () => {
    vi.useFakeTimers();
    const { Ctx, log } = fakeAudio();
    const s = createSound({ Ctx });
    s.unlock();
    const before = log.targets.length;
    s.phase("celebrate");
    expect(log.targets.length).toBeGreaterThan(before);
    const after = log.targets.length;
    s.phase("nonsense");
    expect(log.targets.length).toBe(after);
    s.destroy();
  });

  it("stops everything and lets the audio go when it is closed", () => {
    vi.useFakeTimers();
    const { Ctx, log } = fakeAudio();
    const s = createSound({ Ctx });
    s.unlock();
    log.ctx.currentTime = 3;
    vi.advanceTimersByTime(300);
    s.destroy();
    expect(log.closed).toBe(true);
    const made = log.nodes;
    log.ctx.currentTime += 30;
    vi.advanceTimersByTime(3000);
    expect(log.nodes).toBe(made);
  });

  it("has a voice for every sound it plays", () => {
    ["step", "draw", "pour", "fillDone", "wine", "clink", "cheer", "blip", "cue"].forEach(name =>
      expect(typeof voices[name], name).toBe("function")
    );
  });
});
