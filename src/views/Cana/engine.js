import { Application, Container, Graphics, Sprite, Text } from "pixi.js";
import { createActor } from "xstate";
import { directorMachine, PHASES } from "@/lib/cana/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/cana/lines.js";
import { hash, everyone } from "@/lib/cana/cast.js";
import { drawCharacter, FIG, BASIC, CARRYING } from "./sprites.js";
import { drawFloor, drawLanterns, makeJars, tables, plants, drawCistern } from "./hall.js";

const mulberry = seed => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
class Cancelled extends Error {}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// One person in the courtyard: where they stand, the path they are walking, their pose and what they say.
class Person {
  constructor(char, tex, top, rand) {
    this.char = char;
    this.id = char.id;
    this.tex = tex;
    this.rand = rand;
    this.x = 0;
    this.y = 0;
    this.face = 1;
    this.speed = (50 + rand() * 14) * (char.kind === "servant" ? 1.35 : 1);
    this.path = [];
    this.settle = null;
    this.pose = "idle";
    this.poseUntil = 0;
    this.variant = null;
    this.t = rand() * 20;
    this.sprite = new Sprite(tex.idle);
    this.sprite.anchor.set(FIG.anchorX, FIG.anchorY);
    this.k = FIG.w / tex.idle.width;
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
      v = Math.floor(this.t * 3.4) % 2 ? "wave" : "wave2";
    } else if (this.pose === "dance") {
      v = Math.floor(this.t * 3) % 2 ? "up" : "up2";
      if (!reduced) {
        bob = -Math.abs(Math.sin(this.t * 6)) * 3.2;
        sway = Math.sin(this.t * 3) * 0.1;
      }
    } else if (this.pose === "cheer") {
      v = "up";
      bob = reduced ? 0 : -Math.abs(Math.sin(this.t * 8)) * 3;
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
        this.bubble.position.set(this.x, this.y - FIG.h * 0.72);
      }
    }
  }
}

// Starts the wedding at Cana in `canvas`. Returns a controller to steer it and to tear it down.
export async function startCana({
  canvas,
  host,
  cast,
  layout,
  startPhase = "feast",
  hooks = {},
  reduced = false
}) {
  const {
    WORLD,
    SPAWN,
    CISTERN,
    SEATS,
    DANCE_SPOTS,
    WANDER_SPOTS,
    WATCH_SPOTS,
    HEAD_SEATS,
    MARY_SPOT,
    MUSICIAN_SPOTS,
    HEAD_TABLE
  } = layout;
  const onPhase = name => {
    if (hooks.onPhase) {
      hooks.onPhase(name);
    }
  };
  const onHint = text => {
    if (hooks.onHint) {
      hooks.onHint(text);
    }
  };
  const app = new Application();
  const density = Math.min(window.devicePixelRatio || 1, 2) * 1.3;
  await app.init({
    canvas,
    width: host.clientWidth || 360,
    height: host.clientHeight || 540,
    antialias: true,
    backgroundAlpha: 0,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true
  });

  const grid = layout.buildGrid();
  const find = layout.makeFinder(grid);
  const world = new Container();
  app.stage.addChild(world);
  world.addChild(drawFloor(layout));
  const layer = new Container();
  layer.sortableChildren = true;
  world.addChild(layer);
  tables(layout).forEach(t => layer.addChild(t));
  plants(layout).forEach(p => layer.addChild(p));
  layer.addChild(drawCistern(layout.CISTERN));
  const jars = makeJars(layout);
  jars.forEach(j => layer.addChild(j.g));
  const lanterns = drawLanterns(layout);
  world.addChild(lanterns.g);
  const glow = new Graphics();
  world.addChild(glow);
  const fx = new Container();
  const top = new Container();
  world.addChild(fx, top);

  // ---- the people ----
  const all = everyone(cast);
  const people = [];
  const byId = {};
  for (const c of all) {
    const variants =
      c.kind === "me" || c.kind === "servant"
        ? CARRYING
        : c.kind === "musician"
        ? ["idle", "up", "up2"]
        : BASIC;
    const tex = await drawCharacter(c, variants, density);
    const rand = mulberry(hash(c.id));
    const p = new Person(c, tex, top, rand);
    people.push(p);
    byId[c.id] = p;
    layer.addChild(p.box);
  }
  const me = people.find(p => p.char.kind === "me") || null;
  const guests = people.filter(p => p.char.kind === "guest");
  const servants = people.filter(p => p.char.kind === "servant");
  const musicians = people.filter(p => p.char.kind === "musician");
  const [groom, bride, master, mary] = ["groom", "bride", "master", "mary"].map(id => byId[id]);

  // ---- time: a clock, small timers and tweens ----
  let clock = 0;
  let epoch = 0; // bumped at each phase of the story, which cancels what the servants were doing
  let meEpoch = 0; // bumped at each new thing you ask your character to do
  const timers = [];
  const tweens = [];
  const wait = ms => new Promise(res => timers.push({ at: clock + ms, res }));
  const tween = (ms, fn) => new Promise(res => tweens.push({ t0: clock, ms, fn, res }));
  const runner = getEpoch => async fn => {
    const e = getEpoch();
    const stale = () => e !== getEpoch() || dead;
    try {
      await fn(stale);
    } catch (err) {
      if (!(err instanceof Cancelled)) {
        console.error(err);
      }
    }
  };
  let dead = false;
  const run = runner(() => epoch);
  const runMe = runner(() => meEpoch);
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
  const say = (p, text, ms = 2800) => p.say(text, ms, clock);
  const pose = (p, name, ms) => p.setPose(name, ms, clock);

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
  const spawnSparkle = (x, y) => {
    if (reduced || particles.length > 60) {
      return;
    }
    const g = new Graphics();
    g.circle(0, 0, 1.6).fill(0xfff0a0);
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

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "feast";
  let celebrating = false;
  const spots = { seats: new Map(), dance: new Map() };
  const free = (map, list, near) => {
    const open = list.filter(s => !map.has(s));
    const pool = open.length ? open : list;
    return pool.slice().sort((a, b) => (near ? dist(a, near) - dist(b, near) : 0))[0];
  };

  // ---- behaviour for guests: they idle, pick something to do, go there and do it ----
  const pickGoal = (p, ctx) => {
    const r = p.rand();
    const ms = a => Math.round(a + p.rand() * a);
    if (phase === "celebrate" && r < 0.62) {
      const s = free(spots.dance, DANCE_SPOTS);
      spots.dance.set(s, p.id);
      return {
        kind: "dance",
        x: s.x + (p.rand() - 0.5) * 10,
        y: s.y + (p.rand() - 0.5) * 8,
        ms: ms(8000),
        spot: s
      };
    }
    if ((phase === "fillJars" || phase === "drawOut") && r < 0.6) {
      const s = WATCH_SPOTS[(p.rand() * WATCH_SPOTS.length) | 0];
      return { kind: "look", ...s, ms: ms(4000) };
    }
    if (r < 0.3) {
      const s = free(spots.seats, SEATS);
      spots.seats.set(s, p.id);
      return { kind: "sit", ...s, ms: ms(7000), spot: s };
    }
    if (r < 0.6) {
      const others = people.filter(o => o !== p && (o.char.kind === "guest" || o === me));
      const o = others[(p.rand() * others.length) | 0];
      if (o) {
        const side = o.x > p.x ? -1 : 1;
        return { kind: "chat", x: o.x + side * 24, y: o.y + 3, ms: 3600, partner: o.id };
      }
    }
    const s = WANDER_SPOTS[(p.rand() * WANDER_SPOTS.length) | 0];
    return { kind: "look", ...s, ms: ms(2500) };
  };
  const release = (p, goal) => {
    if (goal && goal.spot) {
      [spots.seats, spots.dance].forEach(m => {
        if (m.get(goal.spot) === p.id) {
          m.delete(goal.spot);
        }
      });
    }
  };
  const roleOf = p => (p.char.kind === "guest" || p.char.kind === "me" ? "guest" : p.char.kind);
  const greet = (a, b) => {
    // a greets b; b waves back and answers a moment later
    a.face = b.x >= a.x ? 1 : -1;
    pose(a, "wave", 1800);
    say(a, lineFor(roleOf(a), phase, hash(a.id + b.id + Math.floor(clock))), 2600);
    if (b !== me) {
      b.stop();
    }
    b.face = a.x >= b.x ? 1 : -1;
    pose(b, "wave", 1800);
    wait(900).then(
      () => !dead && say(b, lineFor(roleOf(b), phase, hash(b.id + a.id + Math.floor(clock))), 2600)
    );
  };
  const machines = new Map();
  const startGuest = (p, delay) => {
    let last = "";
    const actor = createActor(personMachine, {
      input: { pick: ctx => pickGoal(p, ctx), idleMs: () => 900 + p.rand() * 3200 }
    });
    let seenState = "";
    let seenGoal = null;
    actor.subscribe(snap => {
      const goal = snap.context.goal;
      if (snap.value === seenState && goal === seenGoal) {
        return;
      }
      seenState = snap.value;
      seenGoal = goal;
      if (goal) {
        p.goal = goal;
      }
      if (snap.value === "walking" && goal) {
        if (goal.kind !== "talk") {
          p.setPose("idle");
        }
        p.walkTo(find({ x: p.x, y: p.y }, goal)).then(ok =>
          ok ? actor.send({ type: "ARRIVED" }) : null
        );
      } else if (snap.value === "acting" && goal) {
        if (goal.kind === "dance") {
          pose(p, "dance", goal.ms);
        } else if (goal.kind === "chat") {
          const o = byId[goal.partner];
          if (o) {
            greet(p, o);
            const m = machines.get(o.id);
            if (m) {
              m.send({ type: "GOAL", goal: { kind: "talk", x: o.x, y: o.y, ms: 3200 } });
            }
          }
        } else if (goal.kind === "sit") {
          p.face = goal.face || 1;
        }
      } else if (snap.value === "idle") {
        p.setPose("idle");
        release(p, p.goal);
        p.goal = null;
      }
    });
    machines.set(p.id, actor);
    timers.push({ at: clock + delay, res: () => !dead && actor.start() });
  };

  // ---- the servants' work ----
  const fillJar = async (p, jar, stale) => {
    jar.assigned = p.id;
    try {
      await go(p, CISTERN.use, stale);
      p.face = -1;
      await pause(700, stale);
      p.variant = "jar";
      await go(p, jar.def.pour, stale);
      await pause(450, stale);
      p.face = 1;
      await tween(700, t => jar.setLevel(t));
      jar.setLevel(1);
      if (jars.every(j => j.full)) {
        director.send({ type: "ALL_FILLED" });
      }
    } finally {
      p.variant = null;
      if (jar.assigned === p.id) {
        jar.assigned = null;
      }
    }
  };
  const nearestOpenJar = from =>
    jars
      .filter(j => !j.full && !j.assigned)
      .sort((a, b) => dist(a.def.pour, from) - dist(b.def.pour, from))[0];
  const standBy = layout.STANDBY;

  function startFilling() {
    servants.forEach((s, i) =>
      run(async stale => {
        await pause(400 + i * 900, stale);
        for (;;) {
          const jar = nearestOpenJar(s);
          if (!jar || stale()) {
            break;
          }
          await fillJar(s, jar, stale);
        }
        await go(s, standBy[i], stale);
      })
    );
  }
  function turnToWine() {
    jars.forEach((j, i) =>
      run(async stale => {
        await pause(300 + i * 380, stale);
        for (let k = 0; k < 6; k++) {
          spawnSparkle(j.def.x, j.def.y - 12);
        }
        await tween(1300, t => j.setWine(t));
        j.setWine(1);
      })
    );
    // a servant draws a cup and takes it to the governor of the feast
    run(async stale => {
      const s = servants[0];
      await pause(1500, stale);
      await go(s, jars[0].def.pour, stale);
      await pause(500, stale);
      s.variant = "cup";
      await go(s, { x: HEAD_SEATS.master.x, y: HEAD_TABLE.y + HEAD_TABLE.h + 18 }, stale);
      await pause(400, stale);
      s.variant = null;
      master.face = 1;
      pose(master, "cheer", 1600);
      say(master, lineFor("master", "celebrate"), 4200);
      await pause(1800, stale);
      director.send({ type: "TASTED" });
    });
  }
  function startCelebrating() {
    celebrating = true;
    [...guests, ...servants, mary].forEach(p => pose(p, "cheer", 1400));
    run(async stale => {
      // the bridegroom and bride dance, then go back to their seats
      await pause(1500, stale);
      await Promise.all([go(groom, DANCE_SPOTS[8], stale), go(bride, DANCE_SPOTS[9], stale)]);
      spots.dance.set(DANCE_SPOTS[8], groom.id);
      spots.dance.set(DANCE_SPOTS[9], bride.id);
      pose(groom, "dance", 14000);
      pose(bride, "dance", 14000);
      await pause(14000, stale);
      await Promise.all([go(groom, HEAD_SEATS.groom, stale), go(bride, HEAD_SEATS.bride, stale)]);
    });
    // servants pass cups round to the guests
    servants.forEach((s, i) =>
      run(async stale => {
        await pause(2500 + i * 1700, stale);
        while (!stale()) {
          const g = guests[(Math.random() * guests.length) | 0];
          await go(s, jars[(i * 2) % 6].def.pour, stale);
          await pause(400, stale);
          s.variant = "cup";
          await go(s, { x: g.x + (g.x < 180 ? 22 : -22), y: g.y + 4 }, stale);
          s.variant = null;
          pose(g, "cheer", 1400);
          say(g, "Thank you!", 2000);
          await pause(5000, stale);
        }
      })
    );
  }

  function enterPhase(name) {
    epoch++;
    phase = name;
    onPhase(name);
    if (name === "feast") {
      celebrating = false;
      jars.forEach(j => {
        j.assigned = null;
        j.level = 0;
        j.wine = 0;
        j.draw();
      });
      servants.forEach((s, i) => {
        s.variant = null;
        s.stop();
        s.walkTo(find({ x: s.x, y: s.y }, standBy[i]));
        s.setPose("idle");
      });
      [groom, bride, master].forEach((p, i) => {
        const seat = [HEAD_SEATS.groom, HEAD_SEATS.bride, HEAD_SEATS.master][i];
        p.stop();
        p.walkTo(find({ x: p.x, y: p.y }, seat));
        p.setPose("idle");
      });
      guests.forEach(g => machines.get(g.id) && machines.get(g.id).send({ type: "STOP" }));
    } else if (name === "wineRuns") {
      say(mary, lineFor("mary", "wineRuns", 0), 3200);
      wait(3400).then(
        () => !dead && phase === "wineRuns" && say(mary, lineFor("mary", "wineRuns", 1), 3200)
      );
      wait(3600).then(
        () =>
          !dead && phase === "wineRuns" && servants.forEach(s => (s.face = mary.x > s.x ? 1 : -1))
      );
    } else if (name === "fillJars") {
      startFilling();
    } else if (name === "drawOut") {
      // anything left unfilled is filled, then the water turns to wine
      jars.forEach(j => j.setLevel(1));
      turnToWine();
    } else if (name === "celebrate") {
      jars.forEach(j => {
        j.setLevel(1);
        j.setWine(1);
      });
      startCelebrating();
    }
  }
  director.subscribe(snap => {
    if (snap.value !== phase) {
      enterPhase(snap.value);
    }
  });

  // ---- the first moment: the party takes its places and the guests arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(groom, HEAD_SEATS.groom);
  placeAt(bride, HEAD_SEATS.bride);
  placeAt(master, HEAD_SEATS.master);
  placeAt(mary, MARY_SPOT);
  musicians.forEach((m, i) => placeAt(m, MUSICIAN_SPOTS[i]));
  servants.forEach((s, i) => placeAt(s, standBy[i]));
  if (me) {
    placeAt(me, SPAWN);
  }
  guests.forEach((g, i) => {
    placeAt(g, { x: SPAWN.x + ((i % 5) - 2) * 14, y: SPAWN.y + 4 - (i % 2) * 6 });
    startGuest(g, 300 + i * 650);
  });
  // rebuilt part-way through (the hall changed shape), so carry on from where the story was
  for (let k = 0; k < PHASES.indexOf(startPhase); k++) {
    director.send({ type: "SKIP" });
  }
  // the earlier parts were only passed through, so what was said in them is not left hanging in the air
  people.forEach(p => p.clearBubble());
  onPhase(phase);

  // ---- what you can do ----
  const info = {
    jar: "Stone water pots, for the purifying of the Jews.",
    cistern: "The servants draw water from here.",
    table: "The table of the bridegroom and bride."
  };
  const toMe = fn => {
    if (!me) {
      return;
    }
    meEpoch++;
    me.stop();
    me.variant = null;
    runMe(fn);
  };
  const walkMe = point =>
    toMe(async stale => {
      await go(me, point, stale);
    });
  const greetPerson = o =>
    toMe(async stale => {
      const side = o.x > me.x ? -1 : 1;
      await go(me, { x: o.x + side * 24, y: o.y + 3 }, stale);
      greet(me, o);
      if (machines.get(o.id)) {
        machines.get(o.id).send({ type: "GOAL", goal: { kind: "talk", x: o.x, y: o.y, ms: 3200 } });
      }
    });
  const helpFill = jar =>
    toMe(async stale => {
      if (jar.full || (jar.assigned && jar.assigned !== "me")) {
        say(me, "Filled to the brim.", 2200);
        return;
      }
      await fillJar(me, jar, stale);
      if (!stale()) {
        pose(me, "cheer", 1200);
      }
    });
  const offerCup = () =>
    toMe(async stale => {
      const jar = jars[0];
      await go(me, jar.def.pour, stale);
      await pause(400, stale);
      me.variant = "cup";
      const g = guests.slice().sort((a, b) => dist(a, me) - dist(b, me))[0];
      await go(me, { x: g.x + (g.x < 180 ? 22 : -22), y: g.y + 4 }, stale);
      me.variant = null;
      pose(g, "cheer", 1400);
      say(g, "Thank you!", 2000);
      pose(me, "wave", 1500);
    });
  const tap = ev => {
    if (!me) {
      return;
    }
    const p = world.toLocal(ev.global);
    let hit = null;
    let best = 22;
    for (const o of people) {
      if (o === me) {
        continue;
      }
      const d = Math.hypot(p.x - o.x, (p.y - (o.y - 26)) * 0.75);
      if (d < best) {
        best = d;
        hit = o;
      }
    }
    if (hit) {
      return greetPerson(hit);
    }
    const jar = jars.find(j => Math.hypot(p.x - j.def.x, p.y - j.def.y) < 20);
    if (jar) {
      if (phase === "fillJars" && !jar.full) {
        return helpFill(jar);
      }
      if (phase === "celebrate") {
        return offerCup();
      }
      return toMe(async stale => {
        await go(me, jar.def.pour, stale);
        say(
          me,
          phase === "feast" || phase === "wineRuns"
            ? info.jar
            : jar.wine > 0.5
            ? "It has become wine."
            : "Filled to the brim.",
          3200
        );
      });
    }
    if (
      p.x > CISTERN.x - 6 &&
      p.x < CISTERN.x + CISTERN.w + 6 &&
      p.y > CISTERN.y - 14 &&
      p.y < CISTERN.y + CISTERN.h + 6
    ) {
      return toMe(async stale => {
        await go(me, CISTERN.use, stale);
        say(me, info.cistern, 2800);
      });
    }
    if (
      p.x > HEAD_TABLE.x &&
      p.x < HEAD_TABLE.x + HEAD_TABLE.w &&
      p.y > HEAD_TABLE.y - 6 &&
      p.y < HEAD_TABLE.y + HEAD_TABLE.h + 6
    ) {
      return toMe(async stale => {
        await go(
          me,
          { x: HEAD_TABLE.x + HEAD_TABLE.w / 2, y: HEAD_TABLE.y + HEAD_TABLE.h + 18 },
          stale
        );
        say(me, info.table, 2800);
      });
    }
    walkMe(p);
  };
  app.stage.eventMode = "static";
  app.stage.hitArea = app.screen;
  app.stage.on("pointertap", tap);

  // ---- the loop ----
  let notes = 0;
  const step = ticker => {
    const dt = Math.min(0.05, ticker.deltaMS / 1000);
    clock += dt * 1000;
    for (let i = timers.length - 1; i >= 0; i--) {
      if (clock >= timers[i].at) {
        const t = timers.splice(i, 1)[0];
        t.res();
      }
    }
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const u = Math.min(1, (clock - tw.t0) / tw.ms);
      tw.fn(u);
      if (u >= 1) {
        tweens.splice(i, 1);
        tw.res();
      }
    }
    for (const p of people) {
      p.update(dt, clock, reduced);
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
    notes += dt;
    if (notes > (celebrating ? 0.55 : 2.4) && !reduced) {
      notes = 0;
      const m = musicians[(Math.random() * musicians.length) | 0];
      if (m) {
        spawnNote(m.x, m.y - FIG.h * 0.6);
      }
    }
    glow.clear();
    lanterns.glows.forEach((l, i) => {
      glow
        .circle(l.x, l.y, 9 + Math.sin(clock / 500 + i) * 1.4)
        .fill({ color: 0xffd46a, alpha: 0.22 });
    });
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

  return {
    phase: () => phase,
    skip: () => director.send({ type: "SKIP" }),
    replay: () => {
      meEpoch++;
      director.send({ type: "REPLAY" });
    },
    helpWithJars() {
      if (phase !== "fillJars") {
        onHint(
          phase === "celebrate" || phase === "drawOut"
            ? "The pots are already full."
            : "Wait for the servants to be told to fill the pots."
        );
        return;
      }
      const jar = nearestOpenJar(me || SPAWN);
      if (jar) {
        helpFill(jar);
      }
    },
    greetNearest() {
      if (!me) {
        return;
      }
      const o = people.filter(p => p !== me).sort((a, b) => dist(a, me) - dist(b, me))[0];
      if (o) {
        greetPerson(o);
      }
    },
    dance() {
      if (!me) {
        return;
      }
      if (phase !== "celebrate") {
        onHint("The dancing begins once the good wine is poured.");
        return;
      }
      toMe(async stale => {
        const s = free(spots.dance, DANCE_SPOTS, me);
        await go(me, s, stale);
        pose(me, "dance", 12000);
      });
    },
    offerCup() {
      if (phase !== "celebrate") {
        onHint("There is no wine to share yet.");
        return;
      }
      offerCup();
    },
    destroy() {
      dead = true;
      epoch++;
      meEpoch++;
      watch.disconnect();
      director.stop();
      machines.forEach(m => m.stop());
      app.ticker.remove(step);
      app.stage.off("pointertap", tap);
      people.forEach(p => p.clearBubble());
      app.destroy({ removeView: false }, { children: true, texture: true });
    }
  };
}
