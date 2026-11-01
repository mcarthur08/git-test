import { createActor } from "xstate";
import { directorMachine, PARTS, MS } from "@/lib/jordan/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/jordan/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone } from "@/lib/jordan/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawRiver, drawWillow, makeRipple, makeLight, makeRays, makeDove } from "./hall.js";

const SPLASH = 0xdff2fa;
const GOLD = 0xffe9a0;

// Starts "Baptized in the Jordan" in `canvas`. Returns a controller to steer it and to tear it down. The things every
// scene shares come from the kit; this is the river: people wading into the shallows, John baptizing, and the light that
// stands for Jesus coming down to the water, going under it, and coming up as the heavens open and a dove comes down.
export async function startJordan({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "come",
  hooks = {},
  reduced = false
}) {
  const { TREE, JOHN, WADE_SPOTS, LISTEN_SPOTS, LOOK_SPOTS, LIGHT_PATH, WANDER_SPOTS, SPAWN } =
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
  const { ground, layer, fx, find, S, snd, people, byId, tween, run, go, pause, say, pose } = kit;
  const { spawnSparkle, toMe } = kit;

  // ---- the river ----
  ground.addChild(drawRiver(layout));
  layer.addChild(drawWillow(TREE));
  const light = makeLight();
  const rays = makeRays();
  const dove = makeDove();
  ground.addChild(light.g, rays.g);
  fx.addChild(dove.g);

  // ---- the people ----
  await kit.addPeople(everyone(cast), () => BASIC);
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  const john = byId.baptist;
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });

  // ---- the light that is Jesus coming: it moves down to the water, and the people turn to watch it ----
  const L = { x: LIGHT_PATH[0].x, y: LIGHT_PATH[0].y };
  const setLight = (x, y, a) => {
    L.x = x;
    L.y = y;
    light.g.position.set(x, y);
    rays.g.position.set(x, y);
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
  const fadeRays = (to, ms) => {
    const from = rays.g.alpha;
    return tween(ms, t => {
      rays.g.alpha = from + (to - from) * t;
    });
  };
  // where the dove rests: above the light, which is where it lights upon him
  let doveAtRest = false;
  const restDove = () => {
    dove.g.position.set(L.x, L.y - 60);
    dove.g.alpha = 1;
    doveAtRest = true;
  };
  const hideDove = () => {
    dove.g.alpha = 0;
    doveAtRest = false;
  };

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "come";
  let waded = 0;
  let listened = 0;
  let looked = false;
  const claimed = new Set();
  const report = () => {
    if (phase === "opened" || phase === "voice") {
      status(looked ? "You looked up and saw it." : "Look up!");
    } else {
      status(`Waded in: ${waded} · Listened to John: ${listened}`);
    }
  };
  kit.frame.push((dt, clock) => {
    dove.flap(clock / 1000);
    if (doveAtRest) {
      dove.g.y = L.y - 60 + Math.sin(clock / 500) * 2;
    }
    town.forEach(p => {
      if (!p.path.length) {
        p.face = L.x >= p.x ? 1 : -1;
      }
    });
  });

  // ---- behaviour for the people: they stroll the bank, watch and talk ----
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

  // ---- wading in ----
  const nearestSpot = from =>
    WADE_SPOTS.filter(s => !claimed.has(s)).sort((a, b) => dist(a, from) - dist(b, from))[0];
  // Goes to a place in the shallows and wades in up to the knees, with rings spreading on the water. `count` says whether
  // it is counted (it is for you; the others are only taking their turn).
  async function wadeAt(p, spot, stale, count) {
    claimed.add(spot);
    const ring = makeRipple(spot.x, spot.y - 2);
    try {
      await go(p, spot, stale);
      snd.splash();
      pose(p, "cheer", 700);
      ground.addChild(ring);
      ring.scale.set(0.2);
      ring.alpha = 0.95;
      await tween(1400, t => {
        if (!ring.destroyed) {
          ring.scale.set(0.2 + 1.2 * t);
          ring.alpha = 0.95 * (1 - t);
        }
      });
      if (stale()) {
        return;
      }
      for (let k = 0; k < 3; k++) {
        spawnSparkle(spot.x + (k - 1) * 10, spot.y - 20, SPLASH);
      }
      if (count) {
        waded++;
        report();
      }
      await pause(700, stale);
    } finally {
      claimed.delete(spot);
      if (!ring.destroyed) {
        ring.destroy();
      }
    }
  }

  // ---- John in the water, and the ring where Jesus goes under ----
  const dipRing = () => {
    const ring = makeRipple(L.x, L.y - 2);
    ground.addChild(ring);
    ring.scale.set(0.3);
    tween(2400, t => {
      if (!ring.destroyed) {
        ring.scale.set(0.3 + 1.7 * t);
        ring.alpha = 1 - t;
      }
    }).then(() => (ring.destroyed ? null : ring.destroy()));
  };
  const faceLight = p => {
    p.face = L.x >= p.x ? 1 : -1;
  };

  // ---- the parts of the story ----
  const scripts = {
    come: () => {
      status("");
      waded = 0;
      listened = 0;
      looked = false;
      claimed.clear();
      hideDove();
      rays.g.alpha = 0;
      john.stop();
      john.walkTo(find(john, JOHN));
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
      fadeLight(1, 1600);
      // then cometh Jesus from Galilee to Jordan unto John
      lightTo(LIGHT_PATH[1], MS.come);
      // two of the people who have come out take their turn in the water
      town.slice(0, 2).forEach((p, i) =>
        run(async stale => {
          await pause(800 + i * 1800, stale);
          while (!stale()) {
            await wadeAt(p, nearestSpot(WADE_SPOTS[i * 2]) || WADE_SPOTS[i * 2], stale, false);
            await pause(2500, stale);
          }
        })
      );
      run(async stale => {
        await pause(2500, stale);
        say(john, lineFor("baptist", "come"), 3200);
        await pause(3500, stale);
        say(town[2], lineFor("guest", "come", 3), 3200);
      });
    },
    forbid: () => {
      fadeLight(1, 600);
      // into the shallows beside John
      lightTo(LIGHT_PATH[2], 4500);
      run(async stale => {
        await pause(3600, stale);
        faceLight(john);
        // I have need to be baptized of thee, and comest thou to me?
        pose(john, "wave", 2200);
        say(john, lineFor("baptist", "forbid", 0), 4200);
        await pause(4600, stale);
        // Suffer it to be so now
        snd.dove();
        spawnSparkle(L.x, L.y - 40, GOLD);
        await pause(1400, stale);
        say(john, lineFor("baptist", "forbid", 1), 3000);
        say(town[0], lineFor("guest", "forbid", 0), 3200);
      });
    },
    baptized: () => {
      fadeLight(1, 400);
      setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
      faceLight(john);
      run(async stale => {
        say(john, lineFor("baptist", "baptized"), 2600);
        pose(john, "dance", 2400);
        await pause(1200, stale);
        // baptized: down under the water
        snd.dip();
        dipRing();
        await fadeLight(0.2, 1000);
        await pause(800, stale);
        // and up again
        await fadeLight(1, 900);
        spawnSparkle(L.x, L.y - 20, SPLASH);
        spawnSparkle(L.x + 8, L.y - 24, SPLASH);
        say(town[1], lineFor("guest", "baptized", 1), 3000);
        // went up straightway out of the water
        await lightTo(LIGHT_PATH[3], 4600);
      });
    },
    opened: () => {
      fadeLight(1, 400);
      setLight(LIGHT_PATH[3].x, LIGHT_PATH[3].y);
      hideDove();
      run(async stale => {
        // the heavens were opened unto him
        await fadeRays(1, 2400);
        snd.dove();
        people.forEach(p => faceLight(p));
        say(town[0], lineFor("guest", "opened", 0), 3000);
        // and he saw the Spirit of God descending like a dove, and lighting upon him
        const from = { x: L.x - 130, y: 30 };
        dove.g.alpha = 1;
        await tween(5200, t => {
          const e = t * t * (3 - 2 * t);
          dove.g.position.set(
            from.x + (L.x - from.x) * e,
            from.y + (L.y - 60 - from.y) * e + Math.sin(t * 9) * 8 * (1 - t)
          );
        });
        if (stale()) {
          return;
        }
        restDove();
        spawnSparkle(L.x, L.y - 70, GOLD);
        say(john, lineFor("baptist", "opened"), 3000);
        say(town[1], lineFor("guest", "opened", 2), 3200);
        town.forEach(q => pose(q, "up", 2400));
      });
    },
    voice: () => {
      fadeLight(1, 400);
      rays.g.alpha = 1;
      restDove();
      report();
      run(async stale => {
        // and lo a voice from heaven
        snd.voice();
        const ring = makeRipple(L.x, L.y - 2);
        ground.addChild(ring);
        await tween(3000, t => {
          if (!ring.destroyed) {
            ring.scale.set(0.3 + 2.4 * t);
            ring.alpha = 1 - t;
          }
        });
        if (!ring.destroyed) {
          ring.destroy();
        }
        await pause(600, stale);
        people.forEach(q => {
          if (q !== me) {
            pose(q, "cheer", 2000);
          }
        });
        snd.cheer();
        say(town[0], lineFor("guest", "voice", 0), 3200);
        say(john, lineFor("baptist", "voice"), 3200);
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

  // ---- the first moment: John is in the shallows, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(john, JOHN);
  if (me) {
    placeAt(me, SPAWN);
  }
  town.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the river changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  light.g.alpha = 1;
  if (k >= 1) {
    const pt = LIGHT_PATH[Math.min(k, 3)];
    setLight(pt.x, pt.y);
  }
  if (k >= 3) {
    rays.g.alpha = 1;
  }
  if (k === 4) {
    restDove();
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
  const wade = () => {
    if (!me) {
      return;
    }
    const spot = nearestSpot(me);
    if (!spot) {
      onHint("Every place in the water is taken. Wait a moment.");
      return;
    }
    toMe(async stale => {
      await wadeAt(me, spot, stale, true);
    });
  };
  const listen = () => {
    if (!me) {
      return;
    }
    const spot = LISTEN_SPOTS.slice().sort((a, b) => dist(a, me) - dist(b, me))[0];
    toMe(async stale => {
      await go(me, spot, stale);
      me.face = john.x >= me.x ? 1 : -1;
      john.face = me.x >= john.x ? 1 : -1;
      say(john, lineFor("baptist", phase, hash(me.id + listened)), 3400);
      snd.blip();
      listened++;
      report();
    });
  };
  const lookUp = () => {
    if (!me) {
      return;
    }
    if (phase !== "opened" && phase !== "voice") {
      onHint("There is nothing in the sky yet. Watch the river.");
      return;
    }
    const spot = LOOK_SPOTS.slice().sort((a, b) => dist(a, me) - dist(b, me))[0];
    toMe(async stale => {
      await go(me, spot, stale);
      me.face = L.x >= me.x ? 1 : -1;
      pose(me, "up", 2600);
      say(me, phase === "opened" ? "A dove!" : "A voice from heaven!", 3000);
      spawnSparkle(L.x, L.y - 70, GOLD);
      looked = true;
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
    if (p.y > layout.RIVER_Y && p.y < layout.BANK_Y) {
      return wade();
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
    wade,
    listen,
    lookUp,
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
