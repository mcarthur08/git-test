import { createActor } from "xstate";
import { directorMachine, PARTS, MS } from "@/lib/jericho/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/jericho/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, PURSE } from "@/lib/jericho/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawTown, drawSycamore, makeLight, makeLamp } from "./hall.js";

const GOLD = 0xffd45a;
// how high up the sycamore you climb when you join him (a little lower than he does)
const MY_LIFT = 34;
const WELCOME = {
  street: "Peace, Zacchaeus.",
  press: "Do not mind them, Zacchaeus.",
  climb: "Good thinking, Zacchaeus!",
  called: "He has called you by name!",
  murmur: "You are welcome here, Zacchaeus.",
  restore: "That is a fine thing you are doing."
};

// Starts "Zacchaeus in the sycamore" in `canvas`. Returns a controller to steer it and to tear it down. The things every
// scene shares come from the kit; this is the street: the crowd that hides him from the road, the sycamore he climbs, the
// light that stands for Jesus passing by, and the poor he gives to.
export async function startJericho({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "street",
  hooks = {},
  reduced = false
}) {
  const { TREE, HOUSE_DOOR, CROWD_SPOTS, POOR_SPOTS, RECEIVE_SPOTS, LIGHT_PATH, SPAWN } = layout;
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

  // ---- the street ----
  ground.addChild(drawTown(layout));
  const tree = drawSycamore(TREE);
  layer.addChild(tree.back, tree.front);
  const light = makeLight();
  ground.addChild(light.g);
  const lamp = makeLamp(HOUSE_DOOR);
  ground.addChild(lamp.g);
  const doorStep = { x: HOUSE_DOOR.x, y: HOUSE_DOOR.y + 26 };

  // ---- the people ----
  await kit.addPeople(
    everyone(cast),
    c => (c.kind === "me" || c.kind === "zacchaeus" ? [...BASIC, "purse"] : BASIC),
    { purse: PURSE }
  );
  const me = kit.me;
  const crowd = people.filter(p => p.char.kind === "guest");
  const poor = people.filter(p => p.char.kind === "poor");
  const zac = byId.zacchaeus;
  crowd.forEach((p, i) => {
    p.home = CROWD_SPOTS[i % CROWD_SPOTS.length];
  });

  // ---- the light that is Jesus passing: it moves along the street, and the crowd turn to watch it ----
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
  let phase = "street";
  const given = new Set();
  const claimed = new Set();
  const everGiven = () => given.size;
  const lookAt = phase => (phase === "murmur" || phase === "restore" ? HOUSE_DOOR : L);
  // crowd face what they are watching, when they are standing still
  kit.frame.push(() => {
    const target = lookAt(phase);
    crowd.forEach(p => {
      if (!p.path.length) {
        p.face = target.x >= p.x ? 1 : -1;
      }
    });
  });

  // ---- behaviour for the crowd: they stay near their place on the road, watch, and talk to a neighbour ----
  const roleOf = p => (p.char.kind === "me" ? "guest" : p.char.kind);
  const pickGoal = p => {
    const near = crowd.filter(o => o !== p && dist(o, p) < 70);
    if (near.length && p.rand() < 0.3) {
      const o = near[(p.rand() * near.length) | 0];
      const side = o.x > p.x ? -1 : 1;
      return { kind: "chat", x: o.x + side * 24, y: o.y + 3, ms: 3600, partner: o.id };
    }
    return {
      kind: "look",
      x: p.home.x + (p.rand() - 0.5) * 18,
      y: p.home.y + (p.rand() - 0.5) * 8,
      ms: 1800 + Math.round(p.rand() * 2400)
    };
  };
  const greet = (a, b, text) => {
    a.face = b.x >= a.x ? 1 : -1;
    pose(a, "wave", 1800);
    say(a, text || lineFor(roleOf(a), phase, hash(a.id + b.id + Math.floor(S.clock))), 2600);
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
  const sendCrowd = goalFor =>
    crowd.forEach(p => {
      const m = machines.get(p.id);
      if (m) {
        m.send({ type: "GOAL", goal: goalFor(p) });
      }
    });
  const crowdSays = (n, part, ms = 3000) => {
    const pick = [...crowd].sort(() => Math.random() - 0.5).slice(0, n);
    pick.forEach((p, i) =>
      kit.after(i * 700, () => say(p, lineFor("guest", part, hash(p.id) + i), ms))
    );
  };

  // ---- up and down the sycamore ----
  const climbUp = (p, lift, ms) => {
    snd.rustle();
    return tween(ms, t => {
      p.lift = lift * t;
    });
  };
  const climbDown = (p, ms) => {
    const from = p.lift;
    return tween(ms, t => {
      p.lift = from * (1 - t);
    });
  };

  // ---- giving to the poor ----
  const POOR_TOTAL = poor.length;
  const nextPoor = from =>
    poor
      .filter(p => !given.has(p.id) && !claimed.has(p.id))
      .sort((a, b) => dist(a, from) - dist(b, from))[0];
  function receive(p) {
    given.add(p.id);
    snd.coin();
    pose(p, "cheer", 1600);
    say(p, lineFor("poor", "restore", hash(p.id)), 2400);
    for (let k = 0; k < 4; k++) {
      spawnSparkle(p.x + (k - 1.5) * 8, p.y - 40, GOLD);
    }
    status(`Given to the poor: ${everGiven()} of ${POOR_TOTAL}`);
    if (everGiven() === POOR_TOTAL) {
      status("Half his goods to the poor, and fourfold to any he wronged.");
      kit.after(900, () => {
        say(zac, "I restore him fourfold.", 3600);
        snd.cheer();
        fadeLight(1, 1500);
        [...crowd, ...poor].forEach(q => pose(q, "cheer", 2200));
      });
    }
  }
  async function giveTo(p, target, stale) {
    claimed.add(target.id);
    try {
      await go(p, { x: target.x + (target.x > p.x ? -22 : 22), y: target.y + 3 }, stale);
      p.face = target.x >= p.x ? 1 : -1;
      pose(p, "wave", 900);
      await pause(500, stale);
      receive(target);
    } finally {
      claimed.delete(target.id);
    }
  }

  // ---- the parts of the story ----
  const scripts = {
    street: () => {
      status("");
      given.clear();
      claimed.clear();
      lamp.g.alpha = 0;
      zac.lift = 0;
      zac.variant = null;
      zac.walkTo(find(zac, layout.ZACCHAEUS_SPOT));
      poor.forEach((p, i) => p.walkTo(find(p, POOR_SPOTS[i])));
      sendCrowd(p => ({ kind: "look", x: p.home.x, y: p.home.y, ms: 1500 }));
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
      fadeLight(1, 1800);
      run(async stale => {
        await pause(1600, stale);
        snd.step();
        say(zac, lineFor("zacchaeus", "street"), 3600);
        await pause(3200, stale);
        say(poor[0], lineFor("poor", "street", 1), 3000);
        crowdSays(2, "street");
      });
      lightTo(LIGHT_PATH[1], MS.street);
    },
    press: () => {
      lightTo(LIGHT_PATH[2], 10000);
      run(async stale => {
        // he jumps and cranes his neck, and cannot see over them
        for (let k = 0; k < 4; k++) {
          pose(zac, "cheer", 900);
          say(zac, lineFor("zacchaeus", "press"), 2400);
          await pause(2400, stale);
          if (k === 1) {
            crowdSays(2, "press", 2600);
          }
        }
      });
    },
    climb: () => {
      run(async stale => {
        // he ran before, and climbed up into a sycomore tree
        await go(zac, TREE.base, stale);
        zac.face = L.x >= zac.x ? 1 : -1;
        await climbUp(zac, TREE.lift, 1500);
        if (stale()) {
          return;
        }
        say(zac, lineFor("zacchaeus", "climb"), 3400);
        await pause(2200, stale);
        crowdSays(3, "climb");
      });
      lightTo(LIGHT_PATH[3], 8000);
    },
    called: () => {
      fadeLight(1, 1200);
      run(async stale => {
        if (zac.lift < TREE.lift) {
          zac.place(TREE.base.x, TREE.base.y);
          zac.lift = TREE.lift;
        }
        zac.face = L.x >= zac.x ? 1 : -1;
        await pause(2200, stale);
        // he looked up, and saw him, and said unto him, Zacchaeus, make haste, and come down
        snd.call();
        spawnSparkle(TREE.base.x, TREE.base.y - TREE.lift - 20, 0xfff0a0);
        await pause(1400, stale);
        say(zac, lineFor("zacchaeus", "called"), 3000);
        crowdSays(2, "called", 2600);
        await climbDown(zac, 1300);
        pose(zac, "cheer", 1600);
        await pause(1200, stale);
        // and received him joyfully: they go on together to his house
        lightTo(doorStep, 3600);
        await go(zac, doorStep, stale);
        tween(1500, t => {
          lamp.g.alpha = t;
        });
      });
    },
    murmur: () => {
      setLight(doorStep.x, doorStep.y - 6);
      crowd.forEach(p => {
        const m = machines.get(p.id);
        if (m) {
          m.send({ type: "GOAL", goal: { kind: "look", x: p.x, y: p.y, ms: 2500 } });
        }
      });
      run(async stale => {
        await pause(700, stale);
        const talk = crowd.slice(0, 5);
        for (let i = 0; i < talk.length; i++) {
          say(talk[i], lineFor("guest", "murmur", i), 3200);
          await pause(1400, stale);
        }
      });
    },
    restore: () => {
      status(`Given to the poor: ${everGiven()} of ${POOR_TOTAL}`);
      fadeLight(0.8, 1200);
      poor.forEach((p, i) =>
        run(async stale => {
          await go(p, RECEIVE_SPOTS[i], stale);
          p.face = HOUSE_DOOR.x >= p.x ? 1 : -1;
        })
      );
      run(async stale => {
        await pause(3600, stale);
        // And Zacchaeus stood, and said unto the Lord; Behold, Lord, the half of my goods I give to the poor
        say(zac, lineFor("zacchaeus", "restore"), 6000);
        zac.variant = "purse";
        await pause(5200, stale);
        while (!stale()) {
          const target = nextPoor(zac);
          if (!target) {
            break;
          }
          claimed.add(target.id);
          try {
            await go(zac, { x: target.x + (target.x > zac.x ? -20 : 20), y: target.y + 3 }, stale);
          } finally {
            claimed.delete(target.id);
          }
          zac.face = target.x >= zac.x ? 1 : -1;
          if (!given.has(target.id)) {
            receive(target);
          }
          await pause(2200, stale);
        }
        zac.variant = null;
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

  // ---- the first moment: the crowd lines the road, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(zac, layout.ZACCHAEUS_SPOT);
  poor.forEach((p, i) => placeAt(p, POOR_SPOTS[i]));
  if (me) {
    placeAt(me, SPAWN);
  }
  crowd.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 180);
  });
  // rebuilt part-way through (the street changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  light.g.alpha = 1;
  if (k >= 1) {
    setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
  }
  if (k >= 2) {
    placeAt(zac, TREE.base);
    zac.lift = TREE.lift;
    setLight(LIGHT_PATH[3].x, LIGHT_PATH[3].y);
  }
  if (k >= 4) {
    zac.lift = 0;
    placeAt(zac, doorStep);
    setLight(doorStep.x, doorStep.y - 6);
    lamp.g.alpha = 1;
  }
  if (k === 5) {
    poor.forEach((p, i) => placeAt(p, RECEIVE_SPOTS[i]));
  }
  if (sound) {
    sound.phase(phase);
  }
  // the earlier parts were only passed through, so what was said in them is not left hanging in the air
  people.forEach(p => p.clearBubble());
  onPhase(phase);
  if (k >= 0) {
    // run the script of the part we are in (the earlier ones were skipped over)
    scripts[phase]();
  }

  // ---- what you can do ----
  // whatever you ask your character to do, it first climbs down if it was up the tree
  const doMe = fn => {
    if (me && me.lift) {
      me.lift = 0;
    }
    toMe(fn);
  };
  const greetPerson = o =>
    doMe(async stale => {
      const side = o.x > me.x ? -1 : 1;
      await go(me, { x: o.x + side * 24, y: o.y + 3 }, stale);
      greet(me, o);
      snd.blip();
      if (machines.get(o.id)) {
        machines.get(o.id).send({ type: "GOAL", goal: { kind: "talk", x: o.x, y: o.y, ms: 3200 } });
      }
    });
  const climbTree = () => {
    if (!me) {
      return;
    }
    doMe(async stale => {
      await go(me, TREE.seat, stale);
      me.face = L.x >= me.x ? 1 : -1;
      await climbUp(me, MY_LIFT, 1200);
      if (!stale()) {
        say(
          me,
          phase === "street" || phase === "press"
            ? "What a good place to see from!"
            : "I can see everything from here!",
          3000
        );
      }
    });
  };
  const welcome = () => {
    if (!me) {
      return;
    }
    doMe(async stale => {
      await go(me, { x: zac.x + (zac.x > me.x ? -24 : 24), y: zac.y + 3 }, stale);
      me.face = zac.x >= me.x ? 1 : -1;
      pose(me, "wave", 1800);
      say(me, WELCOME[phase], 3000);
      snd.blip();
    });
  };
  const giveCoin = () => {
    if (!me) {
      return;
    }
    if (phase !== "restore") {
      onHint("Wait until Zacchaeus has promised to give.");
      return;
    }
    const target = nextPoor(me);
    if (!target) {
      onHint("Everyone has been given to.");
      return;
    }
    doMe(async stale => {
      me.variant = "purse";
      try {
        await giveTo(me, target, stale);
      } finally {
        me.variant = null;
      }
      if (!stale()) {
        pose(me, "cheer", 900);
      }
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
      return hit.char.kind === "poor" && phase === "restore" && !given.has(hit.id)
        ? giveCoin()
        : greetPerson(hit);
    }
    const { trunk } = TREE;
    if (
      p.x > trunk.x - 34 &&
      p.x < trunk.x + trunk.w + 34 &&
      p.y > trunk.y - 70 &&
      p.y < trunk.y + trunk.h + 12
    ) {
      return climbTree();
    }
    doMe(async stale => {
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
    climbTree,
    giveCoin,
    welcome,
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
