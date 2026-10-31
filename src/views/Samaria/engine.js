import { createActor } from "xstate";
import { directorMachine, PARTS, MS } from "@/lib/samaria/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/samaria/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, BUCKET, JAR } from "@/lib/samaria/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawPlain, drawWell, drawPot, makeLight } from "./hall.js";

const WATER = 0x9fd3e8;
const GOLD = 0xffe9a0;
const THANKS = ["Thank you!", "That is cool and sweet.", "God bless you."];

// Starts "At Jacob's well" in `canvas`. Returns a controller to steer it and to tear it down. The things every scene shares
// come from the kit; this is the plain at Sychar: water drawn from the well and shared, the light that stands for Jesus
// sitting on its edge, the woman of Samaria who comes to draw, and the people of the town who come out to him.
export async function startSamaria({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "road",
  hooks = {},
  reduced = false
}) {
  const { WELL, DRAW_SPOTS, WOMAN_SPOT, GATE, LIGHT_PATH, GATHER_SPOTS, WANDER_SPOTS, SPAWN } =
    layout;
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
  const { ground, layer, find, S, snd, people, byId, tween, run, go, pause, say, pose } = kit;
  const { spawnSparkle, toMe } = kit;
  const wellX = WELL.x + WELL.w / 2;
  const rim = { x: wellX, y: WELL.y + WELL.h * 0.3 };
  // a place in the crowd round him: the sixth and later share a place with an earlier one, a little behind
  const gatherAt = i => {
    const g = GATHER_SPOTS[i % GATHER_SPOTS.length];
    const back = i >= GATHER_SPOTS.length;
    return { x: g.x + (back ? 20 : 0), y: g.y + (back ? 14 : 0) };
  };

  // ---- the plain ----
  ground.addChild(drawPlain(layout));
  layer.addChild(drawWell(WELL));
  // the waterpot the woman leaves behind: it stays where she set it down
  const pot = drawPot(WOMAN_SPOT.x - 14, WOMAN_SPOT.y + 2);
  pot.visible = false;
  layer.addChild(pot);
  const light = makeLight();
  ground.addChild(light.g);

  // ---- the people ----
  await kit.addPeople(everyone(cast), () => [...BASIC, "bucket", "jar"], {
    bucket: BUCKET,
    jar: JAR
  });
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  const woman = byId.woman;
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });

  // ---- the light that is Jesus: it comes down the road, sits on the well, and goes out to meet the town ----
  const L = { x: LIGHT_PATH[0].x, y: LIGHT_PATH[0].y };
  const setLight = (x, y, a) => {
    L.x = x;
    L.y = y;
    light.g.position.set(x, y);
    if (a !== undefined) {
      light.g.alpha = a;
    }
  };
  const lightTo = (pt, ms) => {
    const { x, y } = L;
    return tween(ms, t => setLight(x + (pt.x - x) * t, y + (pt.y - y) * t));
  };
  const fadeLight = (to, ms) => {
    const from = light.g.alpha;
    return tween(ms, t => {
      light.g.alpha = from + (to - from) * t;
    });
  };

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "road";
  let supply = 0;
  let drawn = 0;
  let drinks = 0;
  let told = 0;
  // who has come out to him (the town, the woman and you), and whether the town have stopped strolling to do so
  const gathered = new Set();
  let halted = false;
  const claimed = new Set();
  const report = () => {
    if (phase === "tell" || phase === "believe") {
      status(`Told the town: ${told} · Come to him: ${gathered.size} of ${town.length + 1}`);
    } else {
      status(`Water drawn: ${drawn} · Drinks given: ${drinks}`);
    }
  };
  kit.frame.push(() => {
    town.forEach(p => {
      if (!p.path.length) {
        p.face = L.x >= p.x ? 1 : -1;
      }
    });
  });

  // ---- behaviour for the town: they stroll the plain, watch and talk ----
  const roleOf = p => (p.char.kind === "me" ? "guest" : p.char.kind);
  const pickGoal = p => {
    const near = town.filter(o => o !== p && dist(o, p) < 90);
    if (near.length && p.rand() < 0.3) {
      const o = near[(p.rand() * near.length) | 0];
      const side = o.x > p.x ? -1 : 1;
      return { kind: "chat", x: o.x + side * 24, y: o.y + 3, ms: 3600, partner: o.id };
    }
    const s = WANDER_SPOTS[(p.rand() * WANDER_SPOTS.length) | 0];
    return { kind: "look", x: s.x, y: s.y, ms: 1800 + Math.round(p.rand() * 2600) };
  };
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
      input: { pick: () => pickGoal(p), idleMs: () => 800 + p.rand() * 3000 }
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
      } else if (snap.value === "acting" && goal && goal.kind === "chat") {
        const o = byId[goal.partner];
        if (o) {
          greet(p, o);
          const m = machines.get(o.id);
          if (m) {
            m.send({ type: "GOAL", goal: { kind: "talk", x: o.x, y: o.y, ms: 3200 } });
          }
        }
      }
    });
    machines.set(p.id, actor);
    kit.after(delay, () => actor.start());
  };
  // the town stop strolling while they come out to him, and take it up again if the story is told again
  const haltTown = () => {
    halted = true;
    machines.forEach(m => m.stop());
    machines.clear();
  };
  const wakeTown = () => {
    if (halted) {
      halted = false;
      town.forEach((p, i) => startPerson(p, 300 + i * 250));
    }
  };

  // ---- drawing water ----
  const nearestSpot = from =>
    DRAW_SPOTS.filter(s => !claimed.has(s)).sort((a, b) => dist(a, from) - dist(b, from))[0];
  // Goes to a place by the well, lets the bucket down and draws it up full. `count` says whether the water is added to what
  // you carry (it is for you; the woman is only drawing for her own jar).
  async function drawAt(p, spot, stale, count) {
    claimed.add(spot);
    try {
      await go(p, spot, stale);
      p.face = wellX >= p.x ? 1 : -1;
      p.variant = "bucket";
      snd.draw();
      await pause(900, stale);
      spawnSparkle(rim.x, rim.y - 6, WATER);
      await pause(700, stale);
      spawnSparkle(rim.x, rim.y - 10, WATER);
      spawnSparkle(rim.x + 8, rim.y - 8, WATER);
      if (count) {
        supply++;
        drawn++;
        report();
      }
      await pause(500, stale);
    } finally {
      claimed.delete(spot);
      p.variant = null;
    }
  }

  // ---- coming out to him ----
  const comeOut = (p, i) =>
    run(async stale => {
      await pause(i * 600, stale);
      await go(p, gatherAt(i), stale);
      p.face = L.x >= p.x ? 1 : -1;
      gathered.add(p.id);
      report();
      if (gathered.size >= town.length + 1) {
        snd.cheer();
        town.forEach(q => pose(q, "wave", 2200));
        pose(woman, "cheer", 2000);
      }
    });

  // ---- the parts of the story ----
  const scripts = {
    road: () => {
      status("");
      supply = 0;
      drawn = 0;
      drinks = 0;
      told = 0;
      gathered.clear();
      claimed.clear();
      pot.visible = false;
      wakeTown();
      woman.stop();
      woman.variant = "jar";
      woman.walkTo(find(woman, GATE));
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
      fadeLight(1, 1600);
      // he must needs go through Samaria
      lightTo(LIGHT_PATH[1], MS.road);
      run(async stale => {
        await pause(2500, stale);
        say(woman, lineFor("woman", "road"), 3200);
        await pause(3200, stale);
        say(town[0], lineFor("guest", "road", 0), 3200);
      });
    },
    well: () => {
      fadeLight(1, 600);
      setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y);
      run(async stale => {
        // there cometh a woman of Samaria to draw water
        await drawAt(woman, WOMAN_SPOT, stale, false);
        woman.variant = "jar";
        woman.face = L.x >= woman.x ? 1 : -1;
        await pause(700, stale);
        // Jesus saith unto her, Give me to drink
        spawnSparkle(L.x, L.y - 40, GOLD);
        say(woman, lineFor("woman", "well", 1), 3600);
        await pause(1800, stale);
        say(town[1], lineFor("guest", "well", 1), 3000);
      });
    },
    living: () => {
      fadeLight(1, 600);
      setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y);
      woman.stop();
      woman.place(WOMAN_SPOT.x, WOMAN_SPOT.y);
      woman.variant = "jar";
      woman.face = L.x >= woman.x ? 1 : -1;
      run(async stale => {
        await pause(1200, stale);
        // the gift of God, and living water
        snd.living();
        spawnSparkle(L.x, L.y - 40, WATER);
        spawnSparkle(L.x + 6, L.y - 46, GOLD);
        await pause(2400, stale);
        say(woman, lineFor("woman", "living", 1), 3200);
        await pause(3600, stale);
        // a well of water springing up
        spawnSparkle(rim.x, rim.y - 8, WATER);
        spawnSparkle(rim.x - 6, rim.y - 12, WATER);
        say(woman, lineFor("woman", "living", 0), 3600);
        await pause(2600, stale);
        say(town[2], lineFor("guest", "living", 0), 3000);
      });
    },
    tell: () => {
      report();
      fadeLight(1, 600);
      setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y);
      woman.stop();
      woman.variant = "jar";
      run(async stale => {
        await pause(900, stale);
        say(woman, lineFor("woman", "living", 0), 2600);
        await pause(2200, stale);
        // the woman then left her waterpot, and went her way into the city
        pot.visible = true;
        woman.variant = null;
        snd.setDown();
        say(woman, lineFor("woman", "tell", 0), 4200);
        await pause(500, stale);
        say(town[0], lineFor("guest", "tell", 0), 3000);
        await go(woman, GATE, stale);
        woman.face = L.x >= woman.x ? 1 : -1;
        pose(woman, "wave", 2400);
        say(woman, lineFor("woman", "tell", 1), 3200);
      });
    },
    believe: () => {
      pot.visible = true;
      woman.variant = null;
      report();
      fadeLight(1, 600);
      haltTown();
      // then they went out of the city, and came unto him
      lightTo(LIGHT_PATH[2], 5000);
      town.forEach((p, i) => {
        p.stop();
        comeOut(p, i);
      });
      woman.stop();
      comeOut(woman, town.length);
      run(async stale => {
        await pause(2500, stale);
        snd.living();
        say(woman, lineFor("woman", "believe", 0), 3000);
        await pause(3000, stale);
        say(town[0], lineFor("guest", "believe", 0), 3600);
        await pause(2400, stale);
        say(town[1], lineFor("guest", "believe", 1), 3600);
      });
    }
  };
  function enterPhase(name) {
    kit.nextPart();
    phase = name;
    snd.phase(name);
    onPhase(name);
    scripts[name]();
  }
  director.subscribe(snap => {
    if (snap.value !== phase) {
      enterPhase(snap.value);
    }
  });

  // ---- the first moment: the woman is at the gate of the town, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(woman, GATE);
  woman.variant = "jar";
  if (me) {
    placeAt(me, SPAWN);
  }
  town.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the plain changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  light.g.alpha = 1;
  if (k >= 1) {
    setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y);
  }
  if (k >= 2 && k < 4) {
    placeAt(woman, WOMAN_SPOT);
  }
  if (k === 4) {
    haltTown();
    setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
    pot.visible = true;
    woman.variant = null;
    town.forEach((p, i) => {
      placeAt(p, gatherAt(i));
      gathered.add(p.id);
    });
    placeAt(woman, gatherAt(town.length));
    gathered.add(woman.id);
  }
  if (sound) {
    sound.phase(phase);
  }
  // the earlier parts were only passed through, so what was said in them is not left hanging in the air
  people.forEach(p => p.clearBubble());
  onPhase(phase);
  // run the script of the part we are in (the earlier ones were skipped over)
  scripts[phase]();

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
  const drawWater = () => {
    if (!me) {
      return;
    }
    const spot = nearestSpot(me);
    if (!spot) {
      onHint("Every place at the well is taken. Wait a moment.");
      return;
    }
    toMe(async stale => {
      await drawAt(me, spot, stale, true);
      if (!stale()) {
        pose(me, "cheer", 700);
      }
    });
  };
  const giveDrink = () => {
    if (!me) {
      return;
    }
    if (supply < 1) {
      onHint("You have no water to share. Draw some from the well first.");
      return;
    }
    const o = people.filter(p => p !== me).sort((a, b) => dist(a, me) - dist(b, me))[0];
    if (!o) {
      return;
    }
    toMe(async stale => {
      const side = o.x > me.x ? -1 : 1;
      await go(me, { x: o.x + side * 24, y: o.y + 3 }, stale);
      me.face = o.x >= me.x ? 1 : -1;
      pose(me, "wave", 1000);
      snd.pour();
      spawnSparkle(o.x, o.y - 40, WATER);
      say(o, THANKS[hash(o.id + drinks) % THANKS.length], 2800);
      supply--;
      drinks++;
      report();
    });
  };
  const goTell = () => {
    if (!me) {
      return;
    }
    if (phase !== "tell" && phase !== "believe") {
      onHint("There is nothing to tell yet. Listen at the well.");
      return;
    }
    toMe(async stale => {
      await go(me, { x: GATE.x - 30, y: GATE.y + 40 }, stale);
      say(me, "Come, see a man, which told me all things that ever I did", 3600);
      snd.living();
      told++;
      report();
      await pause(1800, stale);
      await go(me, gatherAt(town.length + 1), stale);
      me.face = L.x >= me.x ? 1 : -1;
      gathered.add(me.id);
      report();
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
    if (
      p.x > WELL.x - 10 &&
      p.x < WELL.x + WELL.w + 10 &&
      p.y > WELL.y - 36 &&
      p.y < WELL.y + WELL.h + 14
    ) {
      return drawWater();
    }
    if (Math.abs(p.x - GATE.x) < 40 && p.y < layout.SKY_Y + 24) {
      return goTell();
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
    drawWater,
    giveDrink,
    goTell,
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
