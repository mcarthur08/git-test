import { createActor } from "xstate";
import { directorMachine, PARTS } from "@/lib/galilee/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/galilee/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, OAR } from "@/lib/galilee/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import {
  makeSea,
  drawBoat,
  drawMast,
  drawPillow,
  makePillowGlow,
  makeWater,
  drawShip,
  makeWeather
} from "./hall.js";

const DISCIPLES = ["peter", "andrew", "james", "john"];
// the fear is over by itself after this long if nobody wakes him
const WAKE_AFTER = 22000;
// how often another wave fills a puddle: quickly in the storm, more slowly while they are afraid
const FILL_EVERY = { storm: 1000, fear: 2600 };
const SPLASH = 0xbfe6f5;

// Starts "Peace, be still" in `canvas`. Returns a controller to steer it and to tear it down. The things every scene
// shares come from the kit; this is the boat: the storm that fills it with water, the bailing, waking him at the back of
// the boat, and the great calm.
export async function startGalilee({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "evening",
  hooks = {},
  reduced = false
}) {
  const { DECK, MAST, PILLOW, CREW_SPOTS, WAKE_SPOTS, WANDER_SPOTS, SPAWN, LITTLE_SHIPS } = layout;
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
  const status = text => {
    if (hooks.onStatus) {
      hooks.onStatus(text);
    }
  };
  const kit = await createKit({ canvas, host, layout, sound, hooks, reduced });
  const { ground, layer, fx, find, S, snd, people, byId, tween, run, go, pause, say, pose } = kit;
  const { spawnSparkle, toMe } = kit;

  // ---- the sea, the boat and the weather ----
  const sea = makeSea(layout);
  ground.addChild(sea.g);
  const ships = LITTLE_SHIPS.map(drawShip);
  ships.forEach(s => ground.addChild(s));
  ground.addChild(drawBoat(layout));
  const water = makeWater(layout);
  ground.addChild(water.sheet);
  water.puddles.forEach(q => ground.addChild(q.g));
  layer.addChild(drawMast(MAST, layout));
  layer.addChild(drawPillow(PILLOW, layout));
  const glow = makePillowGlow(PILLOW);
  ground.addChild(glow.g);
  const weather = makeWeather(layout);
  fx.addChild(weather.shade, weather.rain, weather.flash);

  // ---- the people ----
  await kit.addPeople(everyone(cast), () => [...BASIC, "oar"], { oar: OAR });
  const me = kit.me;
  const crew = people.filter(p => p.char.kind === "guest");
  const disciples = DISCIPLES.map(id => byId[id]);
  const [peter, andrew] = [byId.peter, byId.andrew];

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "evening";
  let woken = false;
  // how stormy it is, from 0 (still) to 1 (the great storm). `target` is where it is heading.
  const W = { level: 0, target: 0, flashAt: 0, fillAt: 0, t: 0 };
  const total = water.puddles.length;
  const wet = () => water.puddles.filter(q => q.wet);
  const setWet = (q, v) => {
    q.wet = v;
    q.g.visible = v;
  };
  const reportWater = () => {
    if (phase === "storm" || phase === "fear") {
      status(`Water in the boat: ${wet().length} of ${total}`);
    }
  };
  const nearestWet = from =>
    water.puddles
      .filter(q => q.wet && !q.claimed)
      .sort((a, b) => dist(a.def, from) - dist(b.def, from))[0];

  // Throws one puddle over the side. Resolves true if there was one to bail.
  async function bailOne(p, stale) {
    const q = nearestWet(p);
    if (!q) {
      return false;
    }
    q.claimed = true;
    try {
      await go(p, q.def, stale);
      pose(p, "dance", 1000);
      snd.splash();
      await pause(900, stale);
      if (q.wet) {
        setWet(q, false);
        spawnSparkle(q.def.x, q.def.y - 4, SPLASH);
        reportWater();
      }
      return true;
    } finally {
      q.claimed = false;
    }
  }

  // ---- the weather and the rising water, once per frame ----
  const { shade, rain, flash, rainTiles } = weather;
  kit.frame.push((dt, now) => {
    W.t += dt;
    const k = Math.min(1, dt * 1.6);
    W.level += (W.target - W.level) * k;
    shade.alpha = W.level * 0.5;
    rain.alpha = reduced ? W.level * 0.5 : W.level * 0.9;
    if (!reduced && W.level > 0.05) {
      rainTiles.forEach(t => {
        t.y += 380 * dt;
        if (t.y >= layout.WORLD.h) {
          t.y -= layout.WORLD.h * 2;
        }
      });
    }
    // the waves slide along, and swell with the wind
    sea.rows.forEach((row, i) => {
      row.x = -((W.t * (14 + i * 9) * (1 + W.level * 2.2)) % 68);
      row.y = row.baseY + Math.sin(W.t * (0.8 + i * 0.3) * (1 + W.level)) * (2 + W.level * 9);
    });
    ships.forEach((s, i) => {
      s.rotation = Math.sin(W.t * (1 + W.level * 2) + i * 2) * (0.05 + W.level * 0.18);
    });
    // the water over the deck follows how many puddles are wet
    const want = wet().length / total;
    water.sheet.alpha += (want * 0.5 - water.sheet.alpha) * k;
    // lightning, now and then, while the storm is up
    flash.alpha = Math.max(0, flash.alpha - dt * 3.2);
    if (W.target > 0.5 && now > W.flashAt && !S.restoring) {
      W.flashAt = now + 3200 + Math.random() * 3200;
      if (!reduced) {
        flash.alpha = 0.55;
      }
      snd.thunder();
    }
    // a wave breaks over the side and fills another puddle
    const every = FILL_EVERY[phase];
    if (every && now > W.fillAt) {
      W.fillAt = now + every;
      const dry = water.puddles.filter(q => !q.wet);
      if (dry.length) {
        setWet(dry[(Math.random() * dry.length) | 0], true);
        snd.wave();
        reportWater();
      }
    }
  });

  // ---- behaviour for the other players: they row, watch the sea and, when it is stormy, bail ----
  const pickGoal = p => {
    const ms = a => Math.round(a + p.rand() * a);
    if ((phase === "storm" || phase === "fear") && nearestWet(p) && p.rand() < 0.7) {
      const q = nearestWet(p);
      return { kind: "bail", x: q.def.x, y: q.def.y, ms: 1000, puddle: q };
    }
    const s = WANDER_SPOTS[(p.rand() * WANDER_SPOTS.length) | 0];
    return { kind: "look", ...s, ms: ms(2500) };
  };
  const roleOf = p => (p.char.kind === "me" ? "guest" : p.char.kind);
  const greet = (a, b) => {
    a.face = b.x >= a.x ? 1 : -1;
    pose(a, "wave", 1800);
    say(a, lineFor(roleOf(a), phase, hash(a.id + b.id + Math.floor(S.clock))), 2600);
    if (b !== me) {
      b.stop();
    }
    b.face = a.x >= b.x ? 1 : -1;
    pose(b, "wave", 1800);
    kit.after(900, () =>
      say(b, lineFor(roleOf(b), phase, hash(b.id + a.id + Math.floor(S.clock))), 2600)
    );
  };
  const machines = new Map();
  const startPerson = (p, delay) => {
    const actor = createActor(personMachine, {
      input: { pick: () => pickGoal(p), idleMs: () => 900 + p.rand() * 3200 }
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
      if (snap.value === "walking" && goal) {
        p.setPose("idle");
        p.walkTo(find({ x: p.x, y: p.y }, goal)).then(ok =>
          ok ? actor.send({ type: "ARRIVED" }) : null
        );
      } else if (snap.value === "acting" && goal) {
        if (goal.kind === "bail") {
          if (goal.puddle.wet) {
            pose(p, "dance", 900);
            snd.splash();
            setWet(goal.puddle, false);
            spawnSparkle(goal.x, goal.y - 4, SPLASH);
            reportWater();
          }
        } else if (goal.kind === "talk") {
          p.face = goal.face || p.face;
        }
      }
    });
    machines.set(p.id, actor);
    kit.after(delay, () => actor.start());
  };

  // ---- the parts of the story ----
  const holdOar = (p, on) => {
    p.variant = on ? "oar" : null;
  };
  function eveningScript() {
    disciples.forEach((d, i) => holdOar(d, i % 2 === 0));
    run(async stale => {
      await pause(1500, stale);
      say(peter, lineFor("peter", "evening"), 3400);
      await pause(3600, stale);
      say(byId.john, lineFor("john", "evening"), 3400);
    });
  }
  function resetAll() {
    status("");
    W.target = 0;
    W.level = 0;
    woken = false;
    water.puddles.forEach(q => setWet(q, false));
    water.sheet.alpha = 0;
    glow.g.alpha = 0;
    disciples.forEach((d, i) => {
      d.stop();
      d.walkTo(find(d, CREW_SPOTS[i]));
    });
    eveningScript();
  }
  function startStorm() {
    disciples.forEach(d => holdOar(d, false));
    W.target = 1;
    W.fillAt = S.clock + 600;
    W.flashAt = S.clock + 1500;
    snd.thunder();
    reportWater();
    run(async stale => {
      await pause(1200, stale);
      say(peter, lineFor("peter", "storm"), 3600);
      await pause(3000, stale);
      say(andrew, lineFor("andrew", "storm"), 3000);
      await pause(2600, stale);
      say(byId.john, lineFor("john", "storm"), 3000);
    });
    // the disciples bail as fast as they can, though the sea fills the boat faster
    disciples.forEach((d, i) =>
      run(async stale => {
        await pause(1800 + i * 600, stale);
        while (!stale()) {
          if (!(await bailOne(d, stale))) {
            await pause(800, stale);
          }
          await pause(500, stale);
        }
      })
    );
  }
  // they go to the back of the boat and wake him, and then he rises and the sea is stilled
  async function wake(stale) {
    if (woken) {
      return;
    }
    woken = true;
    disciples.forEach((d, i) => d.walkTo(find(d, WAKE_SPOTS[i % WAKE_SPOTS.length])));
    await pause(2200, stale);
    say(peter, "Master, carest thou not that we perish?", 3600);
    pose(andrew, "cheer", 1800);
    await pause(3200, stale);
    director.send({ type: "WOKEN" });
  }
  function startFear() {
    status(`Water in the boat: ${wet().length} of ${total}`);
    run(async stale => {
      await pause(1000, stale);
      say(andrew, lineFor("andrew", "fear"), 3200);
      await pause(2400, stale);
      say(byId.james, lineFor("james", "fear"), 3200);
      await pause(WAKE_AFTER - 3400, stale);
      await wake(stale);
    });
    disciples.slice(0, 3).forEach((d, i) =>
      run(async stale => {
        await pause(400 + i * 500, stale);
        while (!stale() && !woken) {
          if (!(await bailOne(d, stale))) {
            await pause(700, stale);
          }
          await pause(400, stale);
        }
      })
    );
  }
  function startCalm() {
    // he arose, and rebuked the wind, and said unto the sea, Peace, be still
    status("A great calm.");
    snd.hush();
    W.target = 0;
    glow.g.alpha = 0;
    tween(2500, t => {
      glow.g.alpha = t * 0.9;
    });
    water.puddles.forEach(q => q.claimed && (q.claimed = false));
    run(async stale => {
      // the water drains away, one puddle after another
      for (const q of water.puddles.filter(x => x.wet)) {
        await pause(260, stale);
        setWet(q, false);
        spawnSparkle(q.def.x, q.def.y - 4, 0xfff0a0);
      }
    });
    run(async stale => {
      disciples.forEach((d, i) => {
        d.walkTo(find(d, CREW_SPOTS[i]));
        pose(d, "idle");
      });
      await pause(1800, stale);
      say(byId.john, lineFor("john", "calm"), 3400);
      await pause(2200, stale);
      say(byId.james, lineFor("james", "calm"), 3400);
    });
  }
  function startMarvel() {
    status("");
    run(async stale => {
      await pause(900, stale);
      say(byId.john, lineFor("john", "marvel"), 4200);
      await pause(1600, stale);
      say(peter, lineFor("peter", "marvel"), 4200);
      await pause(1800, stale);
      say(andrew, lineFor("andrew", "marvel"), 4200);
      disciples.forEach(d => pose(d, "cheer", 2400));
      snd.cheer();
    });
  }
  function enterPhase(name) {
    kit.nextPart();
    phase = name;
    snd.phase(name);
    onPhase(name);
    if (name === "evening") {
      resetAll();
    } else if (name === "storm") {
      startStorm();
    } else if (name === "fear") {
      startFear();
    } else if (name === "calm") {
      woken = true;
      startCalm();
    } else if (name === "marvel") {
      startMarvel();
    }
  }
  director.subscribe(snap => {
    if (snap.value !== phase) {
      enterPhase(snap.value);
    }
  });

  // ---- the first moment: the boat is out on the water and you step aboard ----
  disciples.forEach((d, i) => d.place(CREW_SPOTS[i].x, CREW_SPOTS[i].y));
  if (me) {
    me.place(SPAWN.x, SPAWN.y);
  }
  crew.forEach((p, i) => {
    const s = WANDER_SPOTS[(i * 2 + 1) % WANDER_SPOTS.length];
    p.place(s.x, s.y);
    startPerson(p, 200 + i * 300);
  });
  // rebuilt part-way through (the boat changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  if (k === 1 || k === 2) {
    W.level = 1;
    W.target = 1;
    shade.alpha = 0.5;
    rain.alpha = 0.9;
    water.puddles.forEach((q, i) => setWet(q, k === 2 || i % 2 === 0));
    water.sheet.alpha = 0.4;
  }
  if (k >= 3) {
    glow.g.alpha = 0.9;
    woken = true;
  }
  if (sound) {
    sound.phase(phase);
  }
  // the earlier parts were only passed through, so what was said in them is not left hanging in the air
  people.forEach(p => p.clearBubble());
  onPhase(phase);
  if (startPhase === "evening") {
    eveningScript();
  } else if (k === 1) {
    startStorm();
  } else if (k === 2) {
    // asleep still, and the crew are bailing
    startFear();
  }

  // ---- what you can do ----
  const greetPerson = o =>
    toMe(async stale => {
      const side = o.x > me.x ? -1 : 1;
      await go(me, { x: o.x + side * 24, y: o.y + 3 }, stale);
      greet(me, o);
      snd.blip();
      if (machines.get(o.id)) {
        machines.get(o.id).send({ type: "GOAL", goal: { kind: "talk", x: o.x, y: o.y, ms: 3200 } });
      }
    });
  const bail = () => {
    if (!me) {
      return;
    }
    if (!wet().length) {
      onHint(
        phase === "storm" || phase === "fear" ? "No water to bail right now." : "The deck is dry."
      );
      return;
    }
    toMe(async stale => {
      if (await bailOne(me, stale)) {
        pose(me, "cheer", 700);
      }
    });
  };
  const wakeHim = () => {
    if (!me) {
      return;
    }
    if (phase !== "fear") {
      onHint(
        phase === "evening" || phase === "storm"
          ? "He is asleep. Not yet: wait until the boat is full."
          : "He is awake, and the sea is calm."
      );
      return;
    }
    if (woken) {
      onHint("They are already waking him.");
      return;
    }
    toMe(async stale => {
      await go(me, WAKE_SPOTS[2], stale);
      say(me, "Master, carest thou not that we perish?", 3200);
      run(wake);
    });
  };
  const holdOn = () => {
    if (!me) {
      return;
    }
    toMe(async stale => {
      await go(me, { x: MAST.x + MAST.w / 2, y: MAST.y + MAST.h + 14 }, stale);
      pose(me, "cheer", 1600);
      say(me, phase === "storm" || phase === "fear" ? "Hold on!" : "A steady boat.", 2400);
    });
  };
  const tap = p => {
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
    const puddle = water.puddles.find(q => q.wet && Math.hypot(p.x - q.def.x, p.y - q.def.y) < 20);
    if (puddle) {
      return toMe(async stale => {
        puddle.claimed = true;
        try {
          await go(me, puddle.def, stale);
          pose(me, "dance", 1000);
          snd.splash();
          await pause(800, stale);
          if (puddle.wet) {
            setWet(puddle, false);
            spawnSparkle(puddle.def.x, puddle.def.y - 4, SPLASH);
            reportWater();
          }
        } finally {
          puddle.claimed = false;
        }
      });
    }
    if (
      p.x > PILLOW.x - 8 &&
      p.x < PILLOW.x + PILLOW.w + 8 &&
      p.y > PILLOW.y - 8 &&
      p.y < PILLOW.y + PILLOW.h + 8
    ) {
      return phase === "fear"
        ? wakeHim()
        : onHint("He is asleep on the pillow, at the back of the boat.");
    }
    if (
      p.x > MAST.x - 6 &&
      p.x < MAST.x + MAST.w + 6 &&
      p.y > MAST.y - 6 &&
      p.y < MAST.y + MAST.h + 6
    ) {
      return holdOn();
    }
    toMe(async stale => {
      await go(me, p, stale);
    });
  };
  kit.onTap(tap);

  return {
    phase: () => phase,
    skip: () => director.send({ type: "SKIP" }),
    replay: () => {
      S.meEpoch++;
      director.send({ type: "REPLAY" });
    },
    bail,
    wakeHim,
    holdOn,
    greetNearest() {
      if (!me) {
        return;
      }
      const o = people.filter(p => p !== me).sort((a, b) => dist(a, me) - dist(b, me))[0];
      if (o) {
        greetPerson(o);
      }
    },
    destroy() {
      director.stop();
      machines.forEach(m => m.stop());
      kit.destroy();
    }
  };
}
