import { createActor } from "xstate";
import { directorMachine, PARTS } from "@/lib/wilderness/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor, SCRIPTURE_LINES, PRAYERS } from "@/lib/wilderness/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, STONE } from "@/lib/wilderness/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import {
  drawDesert,
  drawTower,
  drawMountain,
  drawKingdoms,
  drawPrayRock,
  makeStone,
  makeCairn,
  makeHalo,
  makeLight,
  makeTempter,
  makeAngel,
  makeProvision
} from "./hall.js";

const GOLD = 0xffe9a0;
// where the light stands at the start of each part, where it goes, and how long it takes to walk there
const FROM = [0, 1, 1, 2, 3];
const TO = [1, 1, 2, 3, 4];
const WALK = [8000, 0, 4000, 4000, 5000];
// where each angel hovers beside the light once it has come down
const ANGEL_AT = [
  { x: -40, y: -34 },
  { x: 42, y: -38 },
  { x: 2, y: -60 }
];

// Starts "Tempted in the wilderness" in `canvas`. Returns a controller to steer it and to tear it down. The things every
// scene shares come from the kit; this is the wilderness: stones to gather and stack, flat rocks to pray on, the answers of
// Scripture to say, and the light that stands for Jesus walking from the stones to the pinnacle and the mountain, with a
// shadow that follows it until it is told to go, and the angels that come at last.
export async function startWilderness({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "fast",
  hooks = {},
  reduced = false
}) {
  const { WORLD, TOWER, MOUNT, STONE_SPOTS, CAIRN, PRAY_SPOTS, LIGHT_PATH, WANDER_SPOTS, SPAWN } =
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

  // ---- the wilderness ----
  ground.addChild(drawDesert(layout));
  const kingdoms = drawKingdoms(layout);
  ground.addChild(kingdoms);
  layer.addChild(drawTower(TOWER));
  layer.addChild(drawMountain(MOUNT));
  PRAY_SPOTS.forEach(spot => layer.addChild(drawPrayRock(spot)));
  const stones = STONE_SPOTS.map(spot => {
    const s = makeStone(spot);
    layer.addChild(s.g);
    return { spot, stone: s };
  });
  const cairn = makeCairn(CAIRN);
  layer.addChild(cairn.g);
  const light = makeLight();
  ground.addChild(light.g);
  const tempter = makeTempter();
  fx.addChild(tempter.g);
  const angels = ANGEL_AT.map(() => {
    const a = makeAngel();
    fx.addChild(a.g);
    return a;
  });
  const provision = makeProvision();
  layer.addChild(provision.g);

  // ---- the people ----
  await kit.addPeople(everyone(cast), () => [...BASIC, "stone"], { stone: STONE });
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });

  // ---- things that move without being a person: the light, the shadow and the angels ----
  const mover = (g, x, y) => {
    const pos = { x, y };
    const set = (nx, ny, a) => {
      pos.x = nx;
      pos.y = ny;
      g.position.set(nx, ny);
      if (a !== undefined) {
        g.alpha = a;
      }
    };
    set(x, y);
    return {
      pos,
      set,
      // a move or fade is dropped if the story has moved on to the next part before it ends
      to(pt, ms) {
        const { x: x0, y: y0 } = pos;
        const e = S.epoch;
        return tween(ms, t => {
          if (e === S.epoch) {
            set(x0 + (pt.x - x0) * t, y0 + (pt.y - y0) * t);
          }
        });
      },
      fade(to, ms) {
        const from = g.alpha;
        const e = S.epoch;
        return tween(ms, t => {
          if (e === S.epoch) {
            g.alpha = from + (to - from) * t;
          }
        });
      }
    };
  };
  const lightM = mover(light.g, LIGHT_PATH[0].x, LIGHT_PATH[0].y);
  const L = lightM.pos;
  const tempterM = mover(tempter.g, 0, 0);
  const angelM = angels.map(a => mover(a.g, 0, 0));
  // the shadow sways as it drifts
  kit.frame.push((dt, now) => {
    if (!reduced) {
      tempter.g.skew.x = Math.sin(now / 700) * 0.1;
    }
  });
  // the places the shadow goes: beside the light, on top of the pinnacle, on the peak of the mountain
  const besideLight = () => ({ x: L.x + 38, y: L.y - 24 });
  const onTower = { x: TOWER.x + TOWER.w / 2, y: TOWER.y + TOWER.h - TOWER.rise - 18 };
  const onMountain = { x: MOUNT.x + MOUNT.w / 2, y: MOUNT.y + MOUNT.h - MOUNT.rise - 18 };
  const showTempter = (pt, ms) => {
    tempterM.set(pt.x, pt.y, 0);
    tempterM.fade(0.9, ms);
  };
  // the light walks from where the part begins to where it ends, and glows
  const startLight = i => {
    lightM.set(LIGHT_PATH[FROM[i]].x, LIGHT_PATH[FROM[i]].y);
    lightM.fade(1, 1200);
    if (WALK[i]) {
      lightM.to(LIGHT_PATH[TO[i]], WALK[i]);
    }
  };

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "fast";
  let placed = 0;
  let prayers = 0;
  let said = 0;
  const claimed = new Set();
  const report = () => {
    if (phase === "angels") {
      status("The angels are looking after him.");
    } else {
      status(
        `Stones stacked: ${placed} of ${STONE_SPOTS.length} · Prayers: ${prayers} · It is written: ${said}`
      );
    }
  };
  kit.frame.push(() => {
    town.forEach(p => {
      if (!p.path.length) {
        p.face = L.x >= p.x ? 1 : -1;
      }
    });
  });

  // ---- behaviour for the travellers: they wander the sand, look about and talk ----
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
    say(a, lineFor("guest", phase, hash(a.id + b.id + Math.floor(S.clock))), 2600);
    if (b !== me) {
      b.stop();
    }
    b.face = a.x >= b.x ? 1 : -1;
    pose(b, "wave", 1800);
    kit.after(900, () =>
      say(b, lineFor("guest", phase, hash(b.id + a.id + Math.floor(S.clock))), 2600)
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

  // ---- gathering stones and stacking them in the cairn ----
  const nextStone = from =>
    stones
      .filter(s => !s.stone.taken && !claimed.has(s))
      .sort((a, b) => dist(a.spot, from) - dist(b.spot, from))[0];
  const cairnSide = p => ({ x: CAIRN.x + (p.x > CAIRN.x ? 14 : -14), y: CAIRN.y + 14 });
  // Goes to a stone, picks it up, carries it to the cairn and sets it down. If the walk is broken off on the way, the stone
  // is put back where it lay.
  async function gatherOne(p, s, stale) {
    claimed.add(s);
    let carrying = false;
    try {
      await go(p, s.spot, stale);
      p.variant = "stone";
      s.stone.set(true);
      carrying = true;
      snd.stone();
      await pause(500, stale);
      await go(p, cairnSide(s.spot), stale);
      carrying = false;
      p.variant = null;
      cairn.set(++placed);
      snd.stone();
      spawnSparkle(CAIRN.x, CAIRN.y - 24, GOLD);
      report();
      return true;
    } finally {
      claimed.delete(s);
      if (carrying) {
        s.stone.set(false);
      }
      p.variant = null;
    }
  }

  // ---- praying on a flat rock ----
  const nearestRock = from => [...PRAY_SPOTS].sort((a, b) => dist(a, from) - dist(b, from))[0];
  async function prayAt(p, spot, stale) {
    await go(p, spot, stale);
    const halo = makeHalo(spot.x, spot.y - 2);
    ground.addChild(halo);
    halo.scale.set(0.3);
    pose(p, "sit", 2800);
    snd.pray();
    say(p, PRAYERS[prayers % PRAYERS.length], 3000);
    spawnSparkle(spot.x, spot.y - 34, GOLD);
    prayers++;
    report();
    try {
      await tween(2400, t => {
        if (!halo.destroyed) {
          halo.scale.set(0.3 + 0.9 * t);
          halo.alpha = 1 - t;
        }
      });
    } finally {
      if (!halo.destroyed) {
        halo.destroy();
      }
    }
  }

  // ---- "It is written": the light dims as he is tempted, then brightens when the answer is given ----
  async function answer(stale, after) {
    await pause(after, stale);
    lightM.fade(0.5, 900);
    await pause(1800, stale);
    snd.scripture();
    for (let k = 0; k < 3; k++) {
      spawnSparkle(L.x + (k - 1) * 12, L.y - 40, GOLD);
    }
    lightM.fade(1, 700);
  }

  // ---- the parts of the story ----
  const scripts = {
    fast: () => {
      status("");
      placed = 0;
      prayers = 0;
      said = 0;
      claimed.clear();
      stones.forEach(s => s.stone.set(false));
      cairn.set(0);
      tempter.g.alpha = 0;
      kingdoms.alpha = 0;
      provision.g.alpha = 0;
      angels.forEach(a => {
        a.g.alpha = 0;
      });
      startLight(0);
      // he had fasted forty days and forty nights
      run(async stale => {
        await pause(2500, stale);
        say(town[0], lineFor("guest", "fast", 0), 3200);
        await pause(3200, stale);
        say(town[1], lineFor("guest", "fast", 1), 3200);
      });
    },
    stones: () => {
      startLight(1);
      // the tempter came to him: only a shadow, drifting up beside the light
      run(async stale => {
        await pause(1500, stale);
        showTempter(besideLight(), 1800);
        await pause(2200, stale);
        say(town[0], lineFor("guest", "stones", 0), 3200);
      });
      // it is written, Man shall not live by bread alone
      run(stale => answer(stale, 6000));
      run(async stale => {
        await pause(9200, stale);
        say(town[1], lineFor("guest", "stones", 1), 3200);
      });
    },
    pinnacle: () => {
      startLight(2);
      // the devil taketh him up into the holy city, and setteth him on a pinnacle of the temple
      run(async stale => {
        if (tempter.g.alpha < 0.1) {
          showTempter(besideLight(), 800);
        }
        await pause(1000, stale);
        await tempterM.to(onTower, 3000);
      });
      // it is written again, Thou shalt not tempt the Lord thy God
      run(stale => answer(stale, 7000));
      run(async stale => {
        await pause(5000, stale);
        say(town[0], lineFor("guest", "pinnacle", 1), 3200);
      });
    },
    mountain: () => {
      startLight(3);
      // an exceeding high mountain, and all the kingdoms of the world, and the glory of them
      run(async stale => {
        if (tempter.g.alpha < 0.1) {
          showTempter(onTower, 800);
        }
        await pause(500, stale);
        await tempterM.to(onMountain, 3000);
        await pause(500, stale);
        await tween(2500, t => {
          if (!stale()) {
            kingdoms.alpha = t;
          }
        });
      });
      // Get thee hence, Satan: the shadow goes, and the kingdoms fade
      run(async stale => {
        await answer(stale, 8500);
        say(town[0], lineFor("guest", "mountain", 0), 3200);
        tempterM.to({ x: WORLD.w + 50, y: -30 }, 2600);
        tempterM.fade(0, 2600);
        kingdoms.alpha = 0.6;
        await tween(2000, t => {
          if (!stale()) {
            kingdoms.alpha = 0.6 * (1 - t);
          }
        });
      });
    },
    angels: () => {
      // then the devil leaveth him
      tempter.g.alpha = 0;
      kingdoms.alpha = 0;
      startLight(4);
      // and, behold, angels came and ministered unto him
      run(async stale => {
        await pause(2800, stale);
        snd.angels();
        angelM.forEach((a, i) => {
          a.set(L.x + ANGEL_AT[i].x, L.y - 110, 0);
          a.fade(1, 1500);
          a.to({ x: L.x + ANGEL_AT[i].x, y: L.y + ANGEL_AT[i].y }, 2600);
        });
        await pause(2800, stale);
        provision.g.position.set(L.x + 34, L.y + 22);
        provision.g.alpha = 1;
        spawnSparkle(L.x, L.y - 30, GOLD);
        town.forEach(q => pose(q, "cheer", 2200));
        say(town[0], lineFor("guest", "angels", 1), 3200);
        report();
        while (!stale()) {
          await pause(1400, stale);
          spawnSparkle(L.x + (S.clock % 3) * 14 - 14, L.y - 50, GOLD);
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
    if (name !== "fast") {
      report();
    }
  }
  director.subscribe(snap => {
    if (snap.value !== phase) {
      enterPhase(snap.value);
    }
  });

  // ---- the first moment: the travellers are on the sand, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  if (me) {
    placeAt(me, SPAWN);
  }
  town.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the wilderness changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
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
  const gatherStone = target => {
    if (!me) {
      return;
    }
    const s = target && !target.stone.taken && !claimed.has(target) ? target : nextStone(me);
    if (!s) {
      onHint(
        placed >= STONE_SPOTS.length
          ? "Every stone is stacked. They are still only stones."
          : "Someone is carrying the last one."
      );
      return;
    }
    toMe(async stale => {
      await gatherOne(me, s, stale);
    });
  };
  const pray = spot => {
    if (!me) {
      return;
    }
    toMe(async stale => {
      await prayAt(me, spot || nearestRock(me), stale);
    });
  };
  const itIsWritten = () => {
    if (!me) {
      return;
    }
    say(me, SCRIPTURE_LINES[said % 3], 3600);
    pose(me, "cheer", 900);
    snd.scripture();
    spawnSparkle(me.x, me.y - 40, GOLD);
    said++;
    report();
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
    const stone = stones.find(s => !s.stone.taken && dist(s.spot, { x: p.x, y: p.y + 4 }) < 18);
    if (stone) {
      return gatherStone(stone);
    }
    const rock = PRAY_SPOTS.find(s => Math.hypot(p.x - s.x, (p.y - s.y + 4) * 1.5) < 22);
    if (rock) {
      return pray(rock);
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
    gatherStone: () => gatherStone(),
    pray: () => pray(),
    itIsWritten,
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
