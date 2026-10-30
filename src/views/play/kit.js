// What every walk-around scene shares: the PixiJS surface and how it is fitted to its box, the clock with its timers and
// tweens, the people (who walk, pose and speak), the sparkles and music notes, the taps, the sound routing and a tidy
// shutdown. A scene (Cana, Bethsaida, ...) builds on this and adds its own place, story and things to do.
import { Application, Container, Graphics, Sprite, Text } from "pixi.js";
import { mulberry } from "@/lib/cana/music.js";
import { hash } from "@/lib/cana/cast.js";
import { resolutionFor, densityFor } from "@/lib/cana/budget.js";
import { drawCharacter, FIG } from "./sprites.js";

export class Cancelled extends Error {}
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// One person: where they stand, the path they are walking, their pose and what they say. A character can say how
// fast it walks (`speed`, 1 is usual) and how big it is (`scale`, 1 is a grown-up).
export class Person {
  constructor(char, tex, top, rand) {
    this.char = char;
    this.id = char.id;
    this.tex = tex;
    this.rand = rand;
    this.x = 0;
    this.y = 0;
    this.face = 1;
    this.speed = (50 + rand() * 14) * (char.speed || 1);
    this.path = [];
    this.settle = null;
    this.pose = "idle";
    this.poseUntil = 0;
    this.variant = null;
    this.t = rand() * 20;
    this.sprite = new Sprite(tex.idle);
    this.sprite.anchor.set(FIG.anchorX, FIG.anchorY);
    this.k = (FIG.w / tex.idle.width) * (char.scale || 1);
    this.box = new Container();
    this.box.addChild(this.sprite);
    if (char.real || char.kind === "me") {
      const label =
        char.kind === "me"
          ? "You"
          : char.name.length > 12
          ? char.name.slice(0, 11) + "…"
          : char.name;
      this.tag = new Text({
        text: label,
        style: {
          fontFamily: "system-ui, sans-serif",
          fontSize: 8,
          fontWeight: "700",
          fill: char.kind === "me" ? 0xffe2b0 : 0xffffff,
          stroke: { color: 0x2a1c0e, width: 2.4 }
        }
      });
      this.tag.anchor.set(0.5, 0);
      this.tag.y = 4;
      this.box.addChild(this.tag);
    }
    this.top = top;
    this.bubble = null;
    this.bubbleUntil = 0;
  }

  place(x, y) {
    this.x = x;
    this.y = y;
    this.box.position.set(x, y);
    this.box.zIndex = y;
  }

  // Walk along a list of points. Resolves true on arriving, false if something else sent them elsewhere first.
  walkTo(path) {
    if (this.settle) {
      this.settle(false);
    }
    this.path = path ? [...path] : [];
    return new Promise(res => {
      if (!this.path.length) {
        res(!!path);
        return;
      }
      this.settle = res;
    });
  }

  stop() {
    this.path = [];
    if (this.settle) {
      const s = this.settle;
      this.settle = null;
      s(false);
    }
  }

  setPose(pose, ms = 0, now = 0) {
    this.pose = pose;
    this.poseUntil = ms ? now + ms : 0;
  }

  say(text, ms, now) {
    this.clearBubble();
    const label = new Text({
      text,
      style: {
        fontFamily: "system-ui, sans-serif",
        fontSize: 9.5,
        fontWeight: "600",
        fill: 0x2a1c0e,
        align: "center",
        wordWrap: true,
        wordWrapWidth: 112
      }
    });
    label.anchor.set(0.5, 1);
    const w = label.width + 12;
    const h = label.height + 8;
    const g = new Graphics();
    g.roundRect(-w / 2, -h - 6, w, h, 6)
      .fill({ color: 0xffffff, alpha: 0.96 })
      .stroke({ width: 1, color: 0x6a4a2e });
    g.poly([-4, -6.5, 4, -6.5, 0, -1]).fill({ color: 0xffffff, alpha: 0.96 });
    label.y = -10;
    const b = new Container();
    b.addChild(g, label);
    this.top.addChild(b);
    this.bubble = b;
    this.bubbleUntil = now + ms;
  }

  clearBubble() {
    if (this.bubble) {
      this.bubble.destroy({ children: true });
      this.bubble = null;
    }
  }

  update(dt, now, reduced) {
    this.t += dt;
    let moving = false;
    if (this.path.length) {
      const p = this.path[0];
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const d = Math.hypot(dx, dy);
      const step = this.speed * dt;
      if (Math.abs(dx) > 0.4) {
        this.face = dx > 0 ? 1 : -1;
      }
      if (d <= step) {
        this.place(p.x, p.y);
        this.path.shift();
        if (!this.path.length && this.settle) {
          const s = this.settle;
          this.settle = null;
          s(true);
        }
      } else {
        this.place(this.x + (dx / d) * step, this.y + (dy / d) * step);
      }
      moving = true;
    }
    if (this.poseUntil && now >= this.poseUntil) {
      this.pose = "idle";
      this.poseUntil = 0;
    }
    let v = "idle";
    let bob = 0;
    let sway = 0;
    if (this.variant && !this.poseUntil) {
      v = this.variant;
    }
    if (moving) {
      bob = reduced ? 0 : -Math.abs(Math.sin(this.t * 9)) * 2.4;
    } else if (this.pose === "wave") {
      v = Math.floor(this.t * 3.4) % 2 ? "wave" : "idle";
    } else if (this.pose === "dance") {
      v = Math.floor(this.t * 3) % 2 ? "up" : "up2";
      if (!reduced) {
        bob = -Math.abs(Math.sin(this.t * 6)) * 3.2;
        sway = Math.sin(this.t * 3) * 0.1;
      }
    } else if (this.pose === "cheer") {
      v = "up";
      bob = reduced ? 0 : -Math.abs(Math.sin(this.t * 8)) * 3;
    } else if (this.pose === "sit") {
      bob = 0;
    } else if (!reduced) {
      bob = Math.sin(this.t * 1.8) * 0.5;
    }
    const tex = this.tex[v] || this.tex.idle;
    if (this.sprite.texture !== tex) {
      this.sprite.texture = tex;
    }
    this.sprite.scale.set(this.k * this.face, this.k);
    this.sprite.y = bob;
    this.sprite.rotation = sway;
    if (this.bubble) {
      if (now >= this.bubbleUntil) {
        this.clearBubble();
      } else {
        this.bubble.position.set(this.x, this.y - FIG.h * 0.72 * (this.char.scale || 1));
      }
    }
  }
}

// Sets up a scene in `canvas` (inside `host`) for the given hall `layout`, and returns the kit to build it with.
// `sound` is optional; `hooks` may have onLost (the phone took the graphics away: build the scene again).
export async function createKit({
  canvas,
  host,
  layout,
  sound = null,
  hooks = {},
  reduced = false
}) {
  const { WORLD } = layout;
  // S is the scene's shared state: `epoch` goes up at each part of the story (which cancels what the others were doing),
  // `meEpoch` at each new thing you ask your own character to do, and `restoring` while the story is only being passed
  // through to catch up (so nothing is heard).
  const S = { clock: 0, epoch: 0, meEpoch: 0, dead: false, restoring: false };
  // Sounds go through here, so a scene need not care whether there is any sound.
  const snd = new Proxy(
    {},
    {
      get:
        (_, name) =>
        (...args) => {
          if (!S.restoring && sound && typeof sound[name] === "function") {
            sound[name](...args);
          }
        }
    }
  );

  const app = new Application();
  const dpr = window.devicePixelRatio || 1;
  const boxW = host.clientWidth || 360;
  const boxH = host.clientHeight || 540;
  // The drawing surface and the character pictures are only as sharp as this screen can show, which keeps the memory
  // use down on a phone (a page that uses too much is closed by the browser).
  const resolution = resolutionFor(dpr, boxW, boxH);
  const density = densityFor(resolution, Math.min(boxW / WORLD.w, boxH / WORLD.h));
  await app.init({
    canvas,
    width: boxW,
    height: boxH,
    antialias: dpr < 2,
    powerPreference: "low-power",
    backgroundAlpha: 0,
    resolution,
    autoDensity: true
  });
  // half the frames of a game are plenty for this, and it is much easier on a phone's battery and memory
  app.ticker.maxFPS = 30;
  // If the phone takes the graphics away (it does when it is short of memory), give it a moment to give them back,
  // and if it does not, ask for the scene to be built again.
  let lostTimer = null;
  const onLost = e => {
    e.preventDefault();
    lostTimer = setTimeout(() => {
      if (!S.dead && hooks.onLost) {
        hooks.onLost();
      }
    }, 2500);
  };
  const onRestored = () => clearTimeout(lostTimer);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const grid = layout.buildGrid();
  const find = layout.makeFinder(grid);
  const world = new Container();
  app.stage.addChild(world);
  // `ground` holds the floor and what is drawn under everyone; `layer` the things and people that are sorted by how far
  // down the picture they stand; `fx` and `top` (speech) are drawn over all of it.
  const ground = new Container();
  const layer = new Container();
  layer.sortableChildren = true;
  const fx = new Container();
  const top = new Container();
  world.addChild(ground, layer, fx, top);

  // ---- time: a clock, small timers and tweens ----
  const timers = [];
  const tweens = [];
  const wait = ms => new Promise(res => timers.push({ at: S.clock + ms, res }));
  const after = (ms, fn) => timers.push({ at: S.clock + ms, res: () => !S.dead && fn() });
  const tween = (ms, fn) => new Promise(res => tweens.push({ t0: S.clock, ms, fn, res }));
  const runner = getEpoch => async fn => {
    const e = getEpoch();
    const stale = () => e !== getEpoch() || S.dead;
    try {
      await fn(stale);
    } catch (err) {
      if (!(err instanceof Cancelled)) {
        console.error(err);
      }
    }
  };
  const run = runner(() => S.epoch);
  const runMe = runner(() => S.meEpoch);
  const go = async (p, point, stale) => {
    const ok = await p.walkTo(find({ x: p.x, y: p.y }, point));
    if (!ok || stale()) {
      throw new Cancelled();
    }
  };
  const pause = async (ms, stale) => {
    await wait(ms);
    if (stale()) {
      throw new Cancelled();
    }
  };
  const say = (p, text, ms = 2800) => p.say(text, ms, S.clock);
  const pose = (p, name, ms) => p.setPose(name, ms, S.clock);

  // ---- particles ----
  const particles = [];
  const spawnNote = (x, y) => {
    if (reduced || particles.length > 40) {
      return;
    }
    const t = new Text({
      text: Math.random() < 0.5 ? "♪" : "♫",
      style: {
        fontSize: 11,
        fill: [0xb8534a, 0x4a7ab8, 0xc9a04b][(Math.random() * 3) | 0],
        fontWeight: "700"
      }
    });
    t.position.set(x, y);
    fx.addChild(t);
    particles.push({
      o: t,
      life: 2.6,
      age: 0,
      vx: (Math.random() - 0.5) * 8,
      vy: -14 - Math.random() * 6
    });
  };
  const spawnSparkle = (x, y, color = 0xfff0a0) => {
    if (reduced || particles.length > 60) {
      return;
    }
    const g = new Graphics();
    g.circle(0, 0, 1.6).fill(color);
    g.position.set(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 4);
    fx.addChild(g);
    particles.push({
      o: g,
      life: 1.1,
      age: 0,
      vx: (Math.random() - 0.5) * 10,
      vy: -16 - Math.random() * 10
    });
  };

  const kit = {
    app,
    world,
    ground,
    layer,
    fx,
    top,
    find,
    grid,
    density,
    layout,
    S,
    snd,
    people: [],
    byId: {},
    me: null,
    frame: [],
    now: () => S.clock,
    wait,
    after,
    tween,
    run,
    runMe,
    go,
    pause,
    say,
    pose,
    spawnNote,
    spawnSparkle,
    // the story has moved on: what the others were doing is cancelled
    nextPart: () => ++S.epoch,
    // Loads people into the scene. `variantsFor(char)` lists the poses to draw for each, and `held` says which poses hold
    // which item.
    async addPeople(list, variantsFor, held = {}) {
      for (const c of list) {
        const tex = await drawCharacter(c, variantsFor(c), density, held);
        const p = new Person(c, tex, top, mulberry(hash(c.id)));
        kit.people.push(p);
        kit.byId[c.id] = p;
        layer.addChild(p.box);
      }
      kit.me = kit.people.find(p => p.char.kind === "me") || null;
    },
    // what you ask your own character to do replaces what it was doing
    toMe(fn) {
      if (!kit.me) {
        return;
      }
      S.meEpoch++;
      kit.me.stop();
      kit.me.variant = null;
      runMe(fn);
    },
    walkMe(point) {
      kit.toMe(async stale => {
        await go(kit.me, point, stale);
      });
    },
    // a tap on the scene, as a point in the hall
    onTap(fn) {
      kit.tapped = fn;
    },
    tapped: null,
    destroy() {
      S.dead = true;
      S.epoch++;
      S.meEpoch++;
      watch.disconnect();
      app.ticker.remove(step);
      app.stage.off("pointertap", tap);
      kit.people.forEach(p => p.clearBubble());
      // the canvases behind the character pictures are let go now, not at the next garbage collection, which on a
      // phone can be too late (the graphics context itself is released by PixiJS as it shuts down)
      const pictures = kit.people.flatMap(p =>
        Object.values(p.tex).map(t => t.source && t.source.resource)
      );
      clearTimeout(lostTimer);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      app.destroy({ removeView: false }, { children: true, texture: true, textureSource: true });
      pictures.forEach(c => {
        if (c && c.width) {
          c.width = 0;
          c.height = 0;
        }
      });
    }
  };

  const tap = ev => {
    if (kit.me && kit.tapped) {
      kit.tapped(world.toLocal(ev.global));
    }
  };
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointertap", tap);

  // ---- the loop ----
  let stepClock = 0;
  const step = ticker => {
    const dt = Math.min(0.05, ticker.deltaMS / 1000);
    S.clock += dt * 1000;
    for (let i = timers.length - 1; i >= 0; i--) {
      if (S.clock >= timers[i].at) {
        const t = timers.splice(i, 1)[0];
        t.res();
      }
    }
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const u = Math.min(1, (S.clock - tw.t0) / tw.ms);
      tw.fn(u);
      if (u >= 1) {
        tweens.splice(i, 1);
        tw.res();
      }
    }
    for (const p of kit.people) {
      p.update(dt, S.clock, reduced);
    }
    // your footsteps
    if (kit.me && kit.me.path.length) {
      stepClock += dt;
      if (stepClock > 0.34) {
        stepClock = 0;
        snd.step();
      }
    } else {
      stepClock = 0.25;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.age += dt;
      q.o.x += q.vx * dt;
      q.o.y += q.vy * dt;
      q.o.alpha = Math.max(0, 1 - q.age / q.life);
      if (q.age >= q.life) {
        q.o.destroy();
        particles.splice(i, 1);
      }
    }
    kit.frame.forEach(fn => fn(dt, S.clock));
  };
  app.ticker.add(step);

  // ---- fit the hall to its box ----
  const fit = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) {
      return;
    }
    app.renderer.resize(w, h);
    const s = Math.min(w / WORLD.w, h / WORLD.h);
    world.scale.set(s);
    world.position.set((w - WORLD.w * s) / 2, (h - WORLD.h * s) / 2);
  };
  fit();
  const watch = new ResizeObserver(fit);
  watch.observe(host);

  return kit;
}
