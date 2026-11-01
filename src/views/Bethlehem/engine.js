import { createActor } from "xstate";
import { directorMachine, PARTS } from "@/lib/bethlehem/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/bethlehem/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone } from "@/lib/bethlehem/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawField, drawStable, makeFire, makeSheep, makeGlory, makeHost } from "./hall.js";

const GOLD = 0xffe9a0;
// the sheep stands a little beside the place where someone stands to gather it
const beside = spot => ({ x: spot.x + 14, y: spot.y + 3 });

// Starts "Born in Bethlehem" in `canvas`. Returns a controller to steer it and to tear it down. The things every scene
// shares come from the kit; this is the field: shepherds by their fire, a light from heaven and a host of lights singing,
// the way to the stable, and sheep to gather, with a manger where a soft glow lies.
export async function startBethlehem({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "field",
  hooks = {},
  reduced = false
}) {
  const {
    STABLE,
    FIRE,
    MANGER,
    HOLY,
    SHEPHERD_SPOTS,
    VISIT_SPOTS,
    SHEEP_SPOTS,
    FLOCK_SPOTS,
    GLORY,
    WANDER_SPOTS,
    SPAWN
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
  const status = text => {
    if (hooks.onStatus) {
      hooks.onStatus(text);
    }
  };
  const kit = await createKit({ canvas, host, layout, sound, hooks, reduced });
  const { ground, layer, find, S, snd, people, byId, tween, run, go, pause, say, pose } = kit;
  const { spawnSparkle, spawnNote, toMe } = kit;

  // ---- the field ----
  ground.addChild(drawField(layout));
  const stable = drawStable(STABLE, MANGER);
  layer.addChild(stable.g);
  ground.addChild(stable.glow);
  const fire = makeFire(FIRE);
  layer.addChild(fire.g, fire.flame);
  const sheep = SHEEP_SPOTS.map((spot, i) => {
    const g = makeSheep(i);
    const home = beside(spot);
    g.position.set(home.x, home.y);
    g.zIndex = home.y;
    layer.addChild(g);
    return { i, spot, g, home, gathered: false, claimed: false };
  });
  // the light of the angel, and the host of lights that sings with it
  const glory = makeGlory();
  const lights = makeHost(layout);
  ground.addChild(lights, glory);
  kit.frame.push((dt, clock) => {
    if (!reduced) {
      fire.flame.scale.set(1 + Math.sin(clock / 90) * 0.08, 1 + Math.sin(clock / 70 + 1) * 0.14);
      glory.scale.set(1 + Math.sin(clock / 600) * 0.05);
    }
  });

  // ---- the people ----
  await kit.addPeople(everyone(cast), () => BASIC);
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  const shepherds = cast.shepherds.map(c => byId[c.id]);
  const mary = byId.mary;
  const joseph = byId.joseph;
  const watchers = [...town, ...shepherds, mary, joseph];
  const baseSpeed = new Map(shepherds.map(p => [p.id, p.speed]));
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });

  // ---- the light moves from the field to the stable, and everyone looks up at it while it shines ----
  const G = { x: GLORY[0].x, y: GLORY[0].y };
  const setGlory = (pt, a) => {
    G.x = pt.x;
    G.y = pt.y;
    glory.position.set(pt.x, pt.y);
    if (a !== undefined) {
      glory.alpha = a;
    }
  };
  const glideGlory = (pt, ms) => {
    const { x, y } = G;
    return tween(ms, t => setGlory({ x: x + (pt.x - x) * t, y: y + (pt.y - y) * t }));
  };
  const fade = (o, to, ms) => {
    const from = o.alpha;
    return tween(ms, t => {
      o.alpha = from + (to - from) * t;
    });
  };
  setGlory(GLORY[0], 0);
  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "field";
  const atManger = new Set();
  const report = () => {
    const n = sheep.filter(s => s.gathered).length;
    status(
      PARTS.indexOf(phase) >= PARTS.indexOf("haste")
        ? `Sheep gathered: ${n} of ${sheep.length} · Seen the child: ${atManger.size}`
        : `Sheep gathered: ${n} of ${sheep.length}`
    );
  };
  kit.frame.push(() => {
    const lit = (phase === "angel" || phase === "host") && glory.alpha > 0.3;
    watchers.forEach(p => {
      if (lit && !p.path.length) {
        p.face = G.x >= p.x ? 1 : -1;
      }
    });
  });

  // ---- behaviour for the other shepherds: they stroll the field, watch and talk ----
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

  // ---- gathering the sheep ----
  const moveSheep = (s, to, ms) => {
    const { x, y } = s.g;
    s.g.scale.x = to.x >= x ? 1 : -1;
    return tween(ms, t => {
      s.g.position.set(x + (to.x - x) * t, y + (to.y - y) * t);
      s.g.zIndex = s.g.y;
    });
  };
  const nextSheep = from =>
    sheep
      .filter(s => !s.gathered && !s.claimed)
      .sort((a, b) => dist(a.spot, from) - dist(b.spot, from))[0];
  // Goes to a sheep, calls it, and walks it to the flock by the fire.
  async function gatherOne(p, s, stale) {
    s.claimed = true;
    try {
      await go(p, s.spot, stale);
      pose(p, "cheer", 700);
      snd.baa();
      await moveSheep(s, FLOCK_SPOTS[s.i], 1500);
      s.gathered = true;
      spawnSparkle(s.g.x, s.g.y - 12, GOLD);
      report();
    } finally {
      s.claimed = false;
    }
  }
  const resetSheep = () => {
    sheep.forEach(s => {
      s.gathered = false;
      s.claimed = false;
      s.g.position.set(s.home.x, s.home.y);
      s.g.zIndex = s.home.y;
      s.g.scale.x = 1;
    });
  };

  // ---- the parts of the story ----
  const scripts = {
    field: () => {
      atManger.clear();
      resetSheep();
      report();
      setGlory(GLORY[0], 0);
      lights.alpha = 0;
      stable.glow.alpha = 0.5;
      shepherds.forEach((p, i) => {
        p.speed = baseSpeed.get(p.id);
        p.stop();
        p.walkTo(find(p, SHEPHERD_SPOTS[i]));
      });
      mary.walkTo(find(mary, HOLY[0]));
      joseph.walkTo(find(joseph, HOLY[1]));
      // shepherds abiding in the field, keeping watch over their flock by night
      run(async stale => {
        await pause(2500, stale);
        say(shepherds[0], lineFor("shepherd", "field", 0), 3200);
        await pause(2400, stale);
        snd.baa();
        say(mary, lineFor("mary", "field"), 3000);
        await pause(2200, stale);
        say(shepherds[2], lineFor("shepherd", "field", 2), 3000);
      });
    },
    angel: () => {
      // the angel of the Lord came upon them, and the glory of the Lord shone round about them
      setGlory(GLORY[0]);
      fade(glory, 1, 1800);
      lights.alpha = 0;
      snd.glory();
      run(async stale => {
        await pause(900, stale);
        spawnSparkle(G.x, G.y + 20, GOLD);
        // and they were sore afraid
        town.forEach(p => {
          const m = machines.get(p.id);
          if (m) {
            m.send({ type: "GOAL", goal: { kind: "talk", x: p.x, y: p.y, ms: 7000 } });
          }
        });
        say(shepherds[0], lineFor("shepherd", "angel", 0), 3200);
        say(shepherds[1], lineFor("shepherd", "angel", 1), 3200);
        say(town[0], lineFor("guest", "angel", 1), 3200);
        say(joseph, lineFor("joseph", "angel"), 3200);
        await pause(5200, stale);
        // Fear not: for, behold, I bring you good tidings of great joy
        snd.glory();
        spawnSparkle(G.x, G.y + 20, GOLD);
        shepherds.forEach(p => pose(p, "cheer", 1600));
        say(mary, lineFor("mary", "angel"), 3200);
        await pause(4200, stale);
        say(shepherds[2], lineFor("shepherd", "angel", 2), 3000);
      });
    },
    host: () => {
      // a multitude of the heavenly host praising God
      setGlory(GLORY[0], 1);
      fade(lights, 1, 1800);
      snd.praise();
      run(async stale => {
        say(shepherds[0], lineFor("shepherd", "host", 0), 3600);
        say(shepherds[1], lineFor("shepherd", "host", 1), 3600);
        shepherds.forEach(p => pose(p, "cheer", 2400));
        say(mary, lineFor("mary", "host"), 3600);
        while (!stale()) {
          spawnNote(G.x + (Math.random() - 0.5) * 180, G.y + 20 + Math.random() * 40);
          spawnSparkle(G.x + (Math.random() - 0.5) * 220, G.y + Math.random() * 30);
          await pause(450, stale);
        }
      });
    },
    haste: () => {
      // as the angels were gone away from them into heaven
      setGlory(GLORY[0], 1);
      fade(lights, 0, 2200);
      glideGlory(GLORY[2], 9000);
      let arrived = false;
      run(async stale => {
        await pause(1200, stale);
        // the shepherds said one to another, Let us now go even unto Bethlehem
        say(shepherds[0], lineFor("shepherd", "haste", 0), 3600);
        await pause(1500, stale);
        say(shepherds[1], lineFor("shepherd", "haste", 1), 2800);
      });
      // and they came with haste, and found Mary, and Joseph, and the babe lying in a manger
      shepherds.forEach((p, i) =>
        run(async stale => {
          await pause(2200 + i * 600, stale);
          p.speed = baseSpeed.get(p.id) * 1.6;
          await go(p, VISIT_SPOTS[i], stale);
          p.face = MANGER.x >= p.x ? 1 : -1;
          atManger.add(p.id);
          report();
          if (!arrived && shepherds.every(q => atManger.has(q.id))) {
            arrived = true;
            snd.arrive();
            fade(stable.glow, 1, 1400);
            spawnSparkle(MANGER.x, MANGER.y - 22, GOLD);
            [mary, joseph].forEach(q => {
              q.face = p.x >= q.x ? 1 : -1;
              pose(q, "wave", 1800);
            });
            say(mary, lineFor("mary", "haste"), 3200);
            await pause(1400, stale);
            say(joseph, lineFor("joseph", "haste"), 3200);
          }
        })
      );
    },
    return: () => {
      // and they made known abroad the saying which was told them concerning this child
      setGlory(GLORY[2], glory.alpha || 1);
      fade(glory, 0.85, 2000);
      fade(lights, 0, 1000);
      fade(stable.glow, 1, 800);
      report();
      run(async stale => {
        await pause(3200, stale);
        say(mary, lineFor("mary", "return"), 4600);
      });
      shepherds.forEach((p, i) =>
        run(async stale => {
          await pause(600 + i * 1400, stale);
          atManger.add(p.id);
          const o = town[i % town.length];
          const side = o.x > p.x ? -1 : 1;
          p.speed = baseSpeed.get(p.id) * 1.3;
          await go(p, { x: o.x + side * 24, y: o.y + 3 }, stale);
          // and all they that heard it wondered
          greet(p, o);
          await pause(3800, stale);
          // and the shepherds returned, glorifying and praising God
          await go(p, SHEPHERD_SPOTS[i], stale);
          p.speed = baseSpeed.get(p.id);
          snd.praise();
          pose(p, "cheer", 2400);
          for (let k = 0; k < 5; k++) {
            spawnNote(p.x + (Math.random() - 0.5) * 30, p.y - 50);
            await pause(600, stale);
          }
        })
      );
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

  // ---- the first moment: the shepherds are at their fire, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  shepherds.forEach((p, i) => placeAt(p, SHEPHERD_SPOTS[i]));
  placeAt(mary, HOLY[0]);
  placeAt(joseph, HOLY[1]);
  if (me) {
    placeAt(me, SPAWN);
  }
  town.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the field changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  if (k === 1 || k === 2) {
    setGlory(GLORY[0], 1);
  }
  if (k === 2) {
    lights.alpha = 1;
  }
  if (k >= 3) {
    setGlory(GLORY[2], 1);
    stable.glow.alpha = 1;
  }
  if (k === 3) {
    shepherds.forEach((p, i) => placeAt(p, VISIT_SPOTS[i]));
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
  const gatherSheep = pick => {
    if (!me) {
      return;
    }
    const s = pick && !pick.gathered && !pick.claimed ? pick : nextSheep(me);
    if (!s) {
      onHint(
        sheep.every(q => q.gathered)
          ? "Every sheep is safe in the flock."
          : "Someone is with the last sheep."
      );
      return;
    }
    toMe(async stale => {
      await gatherOne(me, s, stale);
      if (!stale()) {
        pose(me, "cheer", 700);
      }
    });
  };
  const sing = () => {
    if (!me) {
      return;
    }
    if (PARTS.indexOf(phase) < PARTS.indexOf("host")) {
      onHint("The song has not begun yet. Watch the sky.");
      return;
    }
    toMe(async stale => {
      pose(me, "cheer", 2600);
      snd.praise();
      say(me, lineFor("shepherd", "host", 0), 3200);
      for (let n = 0; n < 4; n++) {
        spawnNote(me.x + (Math.random() - 0.5) * 30, me.y - 50);
        await pause(500, stale);
      }
    });
  };
  const visit = () => {
    if (!me) {
      return;
    }
    if (PARTS.indexOf(phase) < PARTS.indexOf("haste")) {
      onHint("Wait for the word of the angel, then go and see.");
      return;
    }
    toMe(async stale => {
      await go(me, VISIT_SPOTS[3], stale);
      me.face = MANGER.x >= me.x ? 1 : -1;
      atManger.add(me.id);
      snd.arrive();
      spawnSparkle(MANGER.x, MANGER.y - 22, GOLD);
      say(me, "What a gift.", 3000);
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
    const lamb = sheep.find(s => !s.gathered && Math.hypot(p.x - s.g.x, p.y - (s.g.y - 8)) < 20);
    if (lamb) {
      return gatherSheep(lamb);
    }
    if (
      p.x > STABLE.x - 8 &&
      p.x < STABLE.x + STABLE.w + 8 &&
      p.y > STABLE.y - 24 &&
      p.y < STABLE.y + STABLE.h + 40
    ) {
      return visit();
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
    gatherSheep: () => gatherSheep(),
    sing,
    visit,
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
