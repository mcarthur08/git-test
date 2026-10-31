import { createActor } from "xstate";
import { directorMachine, PARTS, MS } from "@/lib/bethany/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/bethany/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, ALABASTER } from "@/lib/bethany/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import {
  drawVillage,
  drawTable,
  makeDishes,
  makeStone,
  makeWraps,
  drawCloth,
  makeLight
} from "./hall.js";

const GOLD = 0xffe9a0;
const LAVENDER = 0xe3c8ff;
const DUST = 0xd9d0bd;
// how many dishes Martha brings to the table
const DISHES = 5;

// Starts "Bethany" in `canvas`. Returns a controller to steer it and to tear it down. The things every scene shares come
// from the kit; this is the village: a stone rolled away from a grave, Lazarus called out and loosed from his graveclothes,
// and then the supper at the long table where Mary pours out her ointment and the house fills with its fragrance. Jesus is
// a light that walks from the road to the grave and then to the table.
export async function startBethany({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "grave",
  hooks = {},
  reduced = false
}) {
  const { TOMB, TABLE, MOUTH, PUSH, RISEN, LOOSE, MOURN, DOOR, SEATS, MARY, POUR } = layout;
  const { LIGHT_PATH, WANDER_SPOTS, SPAWN } = layout;
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

  // ---- the village ----
  ground.addChild(drawVillage(layout));
  const stone = makeStone(layout);
  layer.addChild(stone.g);
  layer.addChild(drawTable(TABLE));
  const dishes = makeDishes(TABLE);
  layer.addChild(dishes.g);
  const light = makeLight();
  ground.addChild(light.g);

  // ---- the people ----
  // you and Mary can hold the alabaster jar of ointment
  await kit.addPeople(
    everyone(cast),
    c => (c.kind === "me" || c.kind === "mary" ? [...BASIC, "alabaster"] : BASIC),
    { alabaster: ALABASTER }
  );
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  const [mary, martha, lazarus] = ["mary", "martha", "lazarus"].map(id => byId[id]);
  const walkSpeed = lazarus.speed;
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });
  const wraps = makeWraps();
  lazarus.box.addChild(wraps);

  // ---- the light that is Jesus walking: it moves about the village, and the neighbours turn to watch it ----
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
  const faceLight = p => {
    p.face = L.x >= p.x ? 1 : -1;
  };

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "grave";
  let stoneAway = false;
  let rolling = false;
  let loosed = false;
  let served = 0;
  let poured = 0;
  const cloths = [];
  const report = () => {
    if (phase === "grave" || phase === "stone") {
      status(stoneAway ? "The stone is rolled away." : "The stone lies on the grave.");
    } else if (phase === "forth") {
      status(
        loosed ? "Lazarus is loosed, and walks free." : "Lazarus is still bound in graveclothes."
      );
    } else if (phase === "supper") {
      status(`Dishes on the table: ${served} of ${DISHES}`);
    } else {
      status(`Ointment poured out: ${poured}`);
    }
  };
  kit.frame.push(() => {
    town.forEach(p => {
      if (!p.path.length) {
        faceLight(p);
      }
    });
  });

  // ---- behaviour for the neighbours: they mourn by the grave, then sit at the table, and watch and talk ----
  const roleOf = p => (p.char.kind === "me" ? "guest" : p.char.kind);
  const spotsFor = () =>
    phase === "supper" || phase === "anoint"
      ? [...SEATS, ...WANDER_SPOTS.slice(0, 2)]
      : [...MOURN, ...WANDER_SPOTS.slice(0, 2)];
  const pickGoal = p => {
    const near = town.filter(o => o !== p && dist(o, p) < 90);
    if (near.length && p.rand() < 0.3) {
      const o = near[(p.rand() * near.length) | 0];
      const side = o.x > p.x ? -1 : 1;
      return { kind: "chat", x: o.x + side * 24, y: o.y + 3, ms: 3600, partner: o.id };
    }
    const spots = spotsFor();
    const s = spots[(p.rand() * spots.length) | 0];
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

  // ---- the stone ----
  // closed again, as at the start of the story
  const closeStone = () => {
    stoneAway = false;
    rolling = false;
    stone.set(0);
  };
  const openStone = () => {
    stoneAway = true;
    rolling = false;
    stone.set(1);
  };
  async function rollAway(stale) {
    if (stoneAway || rolling) {
      return;
    }
    rolling = true;
    snd.stoneRoll();
    await tween(1600, t => {
      if (!stale()) {
        stone.set(t);
      }
    });
    if (stale()) {
      return;
    }
    openStone();
    spawnSparkle(MOUTH.x + stone.away / 2, MOUTH.y - 14, DUST);
    report();
  }

  // ---- the graveclothes ----
  const wrap = () => {
    loosed = false;
    wraps.visible = true;
    lazarus.speed = walkSpeed * 0.45;
    cloths.splice(0).forEach(c => c.destroy());
  };
  const unwrap = silent => {
    if (loosed) {
      return;
    }
    loosed = true;
    wraps.visible = false;
    lazarus.speed = walkSpeed;
    const c = drawCloth(lazarus.x, lazarus.y);
    ground.addChild(c);
    cloths.push(c);
    if (!silent) {
      snd.unwrap();
      spawnSparkle(lazarus.x, lazarus.y - 40, GOLD);
    }
    report();
  };
  // Goes to Lazarus and takes off his graveclothes.
  async function loosen(p, stale) {
    const side = p.x > lazarus.x ? 1 : -1;
    await go(p, { x: lazarus.x + side * 22, y: lazarus.y + 3 }, stale);
    p.face = lazarus.x >= p.x ? 1 : -1;
    pose(p, "dance", 1400);
    await pause(900, stale);
    unwrap(false);
  }

  // ---- the ointment ----
  // the fragrance rises from a place and drifts up: the house is filled with it
  const odour = (x, y) => {
    for (let k = 0; k < 5; k++) {
      spawnSparkle(x + (k - 2) * 13, y - 22 - (k % 3) * 10, k % 2 ? LAVENDER : GOLD);
    }
  };
  async function pourOut(p, spot, stale, count) {
    p.variant = "alabaster";
    try {
      await go(p, spot, stale);
      faceLight(p);
      pose(p, "dance", 1700);
      snd.anointing();
      await pause(900, stale);
      if (stale()) {
        return;
      }
      odour(L.x, L.y);
      if (count) {
        poured++;
        report();
      }
      await pause(900, stale);
    } finally {
      p.variant = null;
    }
  }

  // ---- the parts of the story ----
  const showLazarus = ms => {
    lazarus.box.alpha = 0;
    return tween(ms, t => {
      lazarus.box.alpha = t;
    });
  };
  const scripts = {
    grave: () => {
      status("The stone lies on the grave.");
      closeStone();
      wrap();
      served = 0;
      poured = 0;
      dishes.set(0);
      lazarus.stop();
      lazarus.place(MOUTH.x, MOUTH.y);
      lazarus.box.alpha = 0;
      [mary, martha].forEach((p, i) => {
        p.stop();
        p.variant = null;
        p.walkTo(find(p, MOURN[i]));
      });
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
      fadeLight(1, 1600);
      run(async stale => {
        await pause(2500, stale);
        // Lord, if thou hadst been here, my brother had not died
        faceLight(mary);
        say(mary, lineFor("mary", "grave"), 3600);
        await pause(3200, stale);
        // Jesus wept
        spawnSparkle(L.x, L.y - 40, GOLD);
        say(town[1 % town.length], lineFor("guest", "grave", 1), 3200);
        await pause(2600, stale);
        say(martha, lineFor("martha", "grave"), 3200);
      });
    },
    stone: () => {
      report();
      lightTo(LIGHT_PATH[1], 5000);
      run(async stale => {
        await pause(2400, stale);
        faceLight(martha);
        say(martha, lineFor("martha", "stone"), 3400);
        await pause(1800, stale);
        say(town[0], lineFor("guest", "stone", 1), 3000);
        await pause(1800, stale);
        // then they took away the stone
        await rollAway(stale);
        say(mary, lineFor("mary", "stone"), 3000);
      });
    },
    forth: () => {
      if (!stoneAway) {
        openStone();
      }
      report();
      run(async stale => {
        await pause(1500, stale);
        // Lazarus, come forth
        snd.risen();
        spawnSparkle(MOUTH.x, MOUTH.y - 50, GOLD);
        lazarus.place(MOUTH.x, MOUTH.y);
        await showLazarus(900);
        if (stale()) {
          return;
        }
        lazarus.walkTo(find(lazarus, RISEN));
        say(lazarus, lineFor("lazarus", "forth"), 3200);
        town.forEach(p => pose(p, "wave", 2200));
        say(town[0], lineFor("guest", "forth", 1), 3000);
        await pause(3600, stale);
        // loose him, and let him go
        [mary, martha].forEach((p, i) =>
          run(async s2 => {
            await pause(i * 600, s2);
            say(p, lineFor(i ? "martha" : "mary", "forth", 1 - i), 3000);
            await loosen(p, s2);
          })
        );
        await pause(4200, stale);
        if (!loosed) {
          unwrap(false);
        }
      });
    },
    supper: () => {
      if (!stoneAway) {
        openStone();
      }
      unwrap(true);
      lazarus.box.alpha = 1;
      report();
      lightTo(LIGHT_PATH[2], MS.supper * 0.5);
      // Lazarus was one of them that sat at the table with him
      lazarus.walkTo(find(lazarus, SEATS[0]));
      mary.walkTo(find(mary, SEATS[1]));
      run(async stale => {
        await pause(2000, stale);
        say(lazarus, lineFor("lazarus", "supper", 1), 3200);
      });
      // and Martha served
      run(async stale => {
        while (!stale()) {
          await go(martha, DOOR, stale);
          await pause(500, stale);
          await go(martha, SEATS[2], stale);
          pose(martha, "dance", 1200);
          if (served < DISHES) {
            served++;
            dishes.set(served);
            spawnSparkle(SEATS[2].x, SEATS[2].y - 36, GOLD);
            report();
          }
          if (served === 1) {
            say(martha, lineFor("martha", "supper"), 3000);
          }
          await pause(1400, stale);
        }
      });
    },
    anoint: () => {
      if (!stoneAway) {
        openStone();
      }
      unwrap(true);
      lazarus.box.alpha = 1;
      served = DISHES;
      dishes.set(DISHES);
      setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
      report();
      martha.stop();
      martha.walkTo(find(martha, DOOR));
      run(async stale => {
        // Mary took a pound of ointment of spikenard, and anointed the feet of Jesus
        await pourOut(mary, MARY, stale, false);
        say(mary, lineFor("mary", "anoint"), 3400);
        await pause(800, stale);
        say(martha, lineFor("martha", "anoint"), 3200);
        snd.cheer();
        town.forEach(p => pose(p, "wave", 2200));
        await pause(1200, stale);
        say(lazarus, lineFor("lazarus", "anoint"), 3200);
        // the house was filled with the odour of the ointment
        for (let i = 0; !stale(); i++) {
          odour(SEATS[i % SEATS.length].x, SEATS[i % SEATS.length].y);
          if (i % 3 === 0) {
            odour(DOOR.x, DOOR.y);
          }
          await pause(1500, stale);
        }
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

  // ---- the first moment: the family and the neighbours are at the grave, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(mary, MOURN[0]);
  placeAt(martha, MOURN[1]);
  placeAt(lazarus, MOUTH);
  lazarus.box.alpha = 0;
  if (me) {
    placeAt(me, SPAWN);
  }
  town.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the village changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  light.g.alpha = 1;
  if (k === 1) {
    setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
  }
  if (k >= 2) {
    setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y);
    openStone();
    lazarus.box.alpha = 1;
    placeAt(lazarus, RISEN);
  }
  if (k >= 3) {
    unwrap(true);
    placeAt(lazarus, SEATS[0]);
    placeAt(mary, SEATS[1]);
    placeAt(martha, DOOR);
    setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
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
  const rollStone = () => {
    if (!me) {
      return;
    }
    if (stoneAway || phase === "forth" || phase === "supper" || phase === "anoint") {
      onHint("The stone is already rolled away.");
      return;
    }
    if (phase === "grave") {
      onHint("They are still mourning. Watch, and wait for the word.");
      return;
    }
    if (rolling) {
      onHint("The stone is already rolling.");
      return;
    }
    toMe(async stale => {
      await go(me, PUSH, stale);
      me.face = TOMB.x + TOMB.w / 2 >= me.x ? 1 : -1;
      pose(me, "dance", 1700);
      await rollAway(stale);
    });
  };
  const looseHim = () => {
    if (!me) {
      return;
    }
    if (phase === "grave" || phase === "stone" || (phase === "forth" && lazarus.box.alpha < 0.5)) {
      onHint("Lazarus is not out of the grave yet.");
      return;
    }
    if (loosed) {
      onHint("Lazarus is already loosed, and sitting down to supper.");
      return;
    }
    toMe(async stale => {
      await go(me, LOOSE, stale);
      await loosen(me, stale);
      if (!stale()) {
        say(me, "There. You are free.", 3000);
      }
    });
  };
  const pourOintment = () => {
    if (!me) {
      return;
    }
    if (phase !== "anoint") {
      onHint("Mary has not brought her ointment yet. Watch the table.");
      return;
    }
    toMe(async stale => {
      await pourOut(me, POUR, stale, true);
      if (!stale()) {
        pose(me, "cheer", 700);
      }
    });
  };
  const tap = p => {
    let hit = null;
    let best = 22;
    for (const o of people) {
      if (o === me || o.box.alpha < 0.5) {
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
      !stoneAway &&
      p.x > TOMB.x - 6 &&
      p.x < TOMB.x + TOMB.w + 6 &&
      p.y > TOMB.y - 6 &&
      p.y < TOMB.y + TOMB.h + 24
    ) {
      return rollStone();
    }
    if (
      phase === "anoint" &&
      p.x > TABLE.x - 6 &&
      p.x < TABLE.x + TABLE.w + 6 &&
      p.y > TABLE.y - 6 &&
      p.y < TABLE.y + TABLE.h + 24
    ) {
      return pourOintment();
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
    rollStone,
    looseHim,
    pourOintment,
    greetNearest() {
      if (!me) {
        return;
      }
      const o = people
        .filter(p => p !== me && p.box.alpha >= 0.5)
        .sort((a, b) => dist(a, me) - dist(b, me))[0];
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
