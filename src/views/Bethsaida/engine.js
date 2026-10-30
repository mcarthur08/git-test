import { createActor } from "xstate";
import { directorMachine, PARTS } from "@/lib/bethsaida/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/bethsaida/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, LOAVES } from "@/lib/bethsaida/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawField, drawTree, drawRock, makeOffering, makeGlow, Basket, makeTuft } from "./hall.js";

const DISCIPLE_KINDS = ["andrew", "philip", "disciple"];
// each company is fed twice, once for each basket of bread that reaches it
const SERVINGS = 2;

// Starts the feeding of the five thousand in `canvas`. Returns a controller to steer it and to tear it down. The things
// every scene shares come from the kit; this is the hillside: the crowd that sits down in companies, the loaves that are
// blessed, the baskets of bread carried round, and the twelve baskets of fragments gathered at the end.
export async function startBethsaida({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "day",
  hooks = {},
  reduced = false
}) {
  const {
    SEATS,
    GROUPS,
    ROCK,
    TREES,
    WANDER_SPOTS,
    DISCIPLE_SPOTS,
    LAD_SPOT,
    ROCK_USE,
    STORE,
    LEFTOVERS,
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
  const { ground, layer, fx, find, S, snd, people, byId, tween, run, go, pause, say, pose } = kit;
  const { spawnSparkle, toMe } = kit;

  // ---- the hillside ----
  ground.addChild(drawField(layout));
  TREES.forEach(t => layer.addChild(drawTree(t)));
  layer.addChild(drawRock(ROCK));
  const offering = makeOffering(ROCK);
  layer.addChild(offering.g);
  const glow = makeGlow(ROCK);
  fx.addChild(glow.g);
  const store = STORE.map(s => new Basket(s, false));
  const left = LEFTOVERS.map(s => new Basket(s, true));
  [...store, ...left].forEach(b => layer.addChild(b.g));
  const tufts = new Map(SEATS.map(s => [s.id, makeTuft(s)]));
  tufts.forEach(t => layer.addChild(t));

  // ---- the people ----
  await kit.addPeople(
    everyone(cast),
    c =>
      c.kind === "me" || c.kind === "lad" || DISCIPLE_KINDS.includes(c.kind)
        ? [...BASIC, "basket"]
        : BASIC,
    { basket: LOAVES }
  );
  const me = kit.me;
  const crowd = people.filter(p => p.char.kind === "guest");
  const disciples = people.filter(p => DISCIPLE_KINDS.includes(p.char.kind));
  const lad = byId.lad;
  const [andrew, philip] = [byId.andrew, byId.philip];

  // ---- sitting in the grass: each person in the crowd has a seat in one of the five companies ----
  const occupant = new Map();
  crowd.forEach((p, i) => {
    p.seat = SEATS.filter(s => s.group === i % GROUPS.length)[Math.floor(i / GROUPS.length)];
  });
  function standUp(p) {
    if (p.tuft) {
      tufts.get(p.tuft.id).visible = false;
      occupant.delete(p.tuft.id);
      p.tuft = null;
    }
    if (p.pose === "sit") {
      p.setPose("idle");
    }
  }
  function sitAt(p, seat) {
    standUp(p);
    p.tuft = seat;
    occupant.set(seat.id, p);
    tufts.get(seat.id).visible = true;
    p.face = seat.face;
    p.setPose("sit");
  }
  const sitters = g => people.filter(p => p.tuft && p.tuft.group === g.id);

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "day";
  const served = GROUPS.map(() => 0);
  const reservedGroups = new Set();
  let collected = 0;
  const TOTAL_SERVINGS = GROUPS.length * SERVINGS;
  const fed = () => served.reduce((a, b) => a + b, 0);

  // ---- behaviour for the crowd: they mill about, then sit when asked, then stand again ----
  const pickGoal = p => {
    const r = p.rand();
    const ms = a => Math.round(a + p.rand() * a);
    if (["sit", "bless", "feed"].includes(phase) && p.seat) {
      return { kind: "sit", x: p.seat.x, y: p.seat.y, ms: 6000, seat: p.seat };
    }
    if (phase === "gather" && p.seat && r < 0.6) {
      return {
        kind: "look",
        x: p.seat.x + (p.rand() - 0.5) * 36,
        y: p.seat.y + 8 + p.rand() * 14,
        ms: ms(3000)
      };
    }
    if (r < 0.4) {
      const others = crowd.filter(o => o !== p && !o.tuft);
      const o = others[(p.rand() * others.length) | 0];
      if (o) {
        const side = o.x > p.x ? -1 : 1;
        return { kind: "chat", x: o.x + side * 24, y: o.y + 3, ms: 3600, partner: o.id };
      }
    }
    const s = WANDER_SPOTS[(p.rand() * WANDER_SPOTS.length) | 0];
    return { kind: "look", ...s, ms: ms(2500) };
  };
  const roleOf = p => (p.char.kind === "me" ? "guest" : p.char.kind);
  const greet = (a, b) => {
    // a greets b; b waves back and answers a moment later
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
        if (goal.kind !== "talk" && goal.kind !== "sit") {
          standUp(p);
          p.setPose("idle");
        }
        p.walkTo(find({ x: p.x, y: p.y }, goal)).then(ok =>
          ok ? actor.send({ type: "ARRIVED" }) : null
        );
      } else if (snap.value === "acting" && goal) {
        if (goal.kind === "sit") {
          sitAt(p, goal.seat);
        } else if (goal.kind === "chat") {
          const o = byId[goal.partner];
          if (o) {
            greet(p, o);
            const m = machines.get(o.id);
            if (m) {
              m.send({ type: "GOAL", goal: { kind: "talk", x: o.x, y: o.y, ms: 3200 } });
            }
          }
        }
      } else if (snap.value === "idle") {
        p.setPose(p.tuft ? "sit" : "idle");
      }
    });
    machines.set(p.id, actor);
    kit.after(delay, () => actor.start());
  };
  // tell the crowd to go somewhere (or sit), whatever they were doing
  const sendCrowd = goalFor =>
    crowd.forEach(p => {
      const m = machines.get(p.id);
      if (m) {
        m.send({ type: "GOAL", goal: goalFor(p) });
      }
    });
  const wanderGoal = p => {
    const s = WANDER_SPOTS[(p.rand() * WANDER_SPOTS.length) | 0];
    return { kind: "look", ...s, ms: 2500 };
  };

  // ---- feeding the companies ----
  const nextGroup = () =>
    GROUPS.filter(g => served[g.id] < SERVINGS && !reservedGroups.has(g.id)).sort(
      (a, b) => served[a.id] - served[b.id]
    )[0];
  const nearestBasket = (list, state, from) =>
    list.filter(b => b.state === state).sort((a, b) => dist(a.def, from) - dist(b.def, from))[0];
  async function serveGroup(p, g, stale) {
    reservedGroups.add(g.id);
    try {
      const b = nearestBasket(store, "store", p);
      if (!b) {
        return;
      }
      b.state = "taken";
      await go(p, b.def, stale);
      snd.thud();
      b.hide();
      p.variant = "basket";
      await go(p, { x: g.x, y: g.y + g.ry + 16 }, stale);
      snd.breadBreak();
      const eaters = sitters(g);
      eaters.forEach(m => pose(m, "cheer", 1400));
      if (eaters.length) {
        const m = eaters[(Math.random() * eaters.length) | 0];
        say(m, lineFor("guest", "feed", hash(m.id) + served[g.id]), 2200);
      }
      for (let k = 0; k < 5; k++) {
        spawnSparkle(g.x + (k - 2) * 12, g.y - 6, 0xffe9a0);
      }
      served[g.id]++;
      status(`Fed: ${fed()} of ${TOTAL_SERVINGS}`);
      if (fed() >= TOTAL_SERVINGS) {
        director.send({ type: "ALL_SERVED" });
      }
    } finally {
      p.variant = null;
      reservedGroups.delete(g.id);
    }
  }

  // ---- gathering the fragments ----
  async function collect(p, b, stale) {
    b.state = "reserved";
    try {
      await go(p, b.def, stale);
      b.hide();
      b.state = "collected";
      collected++;
      snd.pickUp();
      status(`Baskets gathered: ${collected} of ${left.length}`);
      spawnSparkle(b.def.x, b.def.y - 8, 0xffe9a0);
      if (collected === left.length) {
        status("All twelve baskets are full: nothing was lost.");
        [...crowd, ...disciples, lad].forEach(q => pose(q, "cheer", 2200));
        snd.cheer();
        snd.bless();
        say(andrew, "Nothing was lost.", 3600);
      }
    } finally {
      if (b.state === "reserved") {
        b.state = "left";
      }
    }
  }

  // ---- the parts of the story ----
  const dayScript = () =>
    run(async stale => {
      await pause(1500, stale);
      say(philip, lineFor("philip", "day"), 6200);
      await pause(5200, stale);
      say(disciples[2], lineFor("disciple", "day"), 3200);
    });
  function resetAll() {
    status("");
    served.fill(0);
    reservedGroups.clear();
    collected = 0;
    store.forEach(b => {
      b.state = "idle";
      b.hide();
    });
    left.forEach(b => {
      b.state = "idle";
      b.hide();
    });
    offering.show(0);
    glow.g.alpha = 0;
    people.forEach(p => {
      standUp(p);
      p.variant = null;
    });
    lad.variant = "basket";
    disciples.forEach((d, i) => {
      d.stop();
      d.walkTo(find(d, DISCIPLE_SPOTS[i]));
    });
    lad.stop();
    lad.walkTo(find(lad, LAD_SPOT));
    sendCrowd(wanderGoal);
    dayScript();
  }
  function startGive() {
    run(async stale => {
      await pause(900, stale);
      say(andrew, lineFor("andrew", "give"), 6200);
      await pause(3600, stale);
      say(philip, lineFor("philip", "give"), 3400);
      // the lad brings his bread and the two fishes, and they are laid out on the rock
      await go(lad, ROCK_USE, stale);
      snd.thud();
      lad.variant = null;
      for (let k = 1; k <= offering.total; k++) {
        offering.show(k);
        await pause(260, stale);
      }
      say(lad, lineFor("lad", "give"), 2800);
    });
  }
  function startSit() {
    disciples.forEach((d, i) =>
      run(async stale => {
        await pause(300 + i * 500, stale);
        const g = GROUPS[(i * 2) % GROUPS.length];
        await go(d, { x: g.x, y: g.y + g.ry + 20 }, stale);
        say(d, lineFor(d.char.kind, "sit", i), 3000);
      })
    );
    sendCrowd(p => ({ kind: "sit", x: p.seat.x, y: p.seat.y, ms: 6000, seat: p.seat }));
  }
  function startBless() {
    snd.bless();
    tween(1500, t => {
      glow.g.alpha = t * 0.9;
    });
    run(async stale => {
      // the disciples gather round the rock, and the bread keeps coming
      Promise.all(disciples.map((d, i) => go(d, DISCIPLE_SPOTS[i], stale).catch(() => null)));
      await pause(900, stale);
      say(lad, lineFor("lad", "bless"), 3000);
      for (let k = 0; k < store.length; k++) {
        await pause(520, stale);
        store[k].state = "store";
        store[k].show();
        spawnSparkle(ROCK.x + ROCK.w / 2 + (k - 5) * 8, ROCK.y + 4, 0xfff0a0);
        if (k % 2 === 0) {
          snd.breadBreak();
        }
      }
    });
  }
  function startFeed() {
    status(`Fed: ${fed()} of ${TOTAL_SERVINGS}`);
    disciples.forEach((d, i) =>
      run(async stale => {
        await pause(600 + i * 700, stale);
        for (;;) {
          const g = nextGroup();
          if (!g || stale()) {
            break;
          }
          await serveGroup(d, g, stale);
          await pause(300, stale);
        }
        await go(d, DISCIPLE_SPOTS[i], stale);
      })
    );
  }
  function startGather() {
    status(`Baskets gathered: ${collected} of ${left.length}`);
    tween(1500, t => {
      glow.g.alpha = 0.9 * (1 - t);
    });
    // everyone stands up and looks round
    crowd.forEach(p => standUp(p));
    sendCrowd(p => ({
      kind: "look",
      x: p.seat.x + (p.rand() - 0.5) * 36,
      y: p.seat.y + 8 + p.rand() * 14,
      ms: 3000
    }));
    run(async stale => {
      for (const b of left) {
        await pause(240, stale);
        b.state = "left";
        b.show();
        spawnSparkle(b.def.x, b.def.y - 8, 0xffe9a0);
      }
    });
    disciples.forEach((d, i) =>
      run(async stale => {
        await pause(3500 + i * 800, stale);
        for (;;) {
          const b = nearestBasket(left, "left", d);
          if (!b || stale()) {
            break;
          }
          await collect(d, b, stale);
          await pause(500, stale);
        }
        await go(d, DISCIPLE_SPOTS[i], stale);
      })
    );
  }
  function enterPhase(name) {
    kit.nextPart();
    phase = name;
    snd.phase(name);
    onPhase(name);
    if (name === "day") {
      resetAll();
    } else if (name === "give") {
      startGive();
    } else if (name === "sit") {
      startSit();
    } else if (name === "bless") {
      startBless();
    } else if (name === "feed") {
      startFeed();
    } else if (name === "gather") {
      startGather();
    }
  }
  director.subscribe(snap => {
    if (snap.value !== phase) {
      enterPhase(snap.value);
    }
  });

  // ---- the first moment: the crowd is on the hillside and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  disciples.forEach((d, i) => placeAt(d, DISCIPLE_SPOTS[i]));
  placeAt(lad, LAD_SPOT);
  lad.variant = "basket";
  if (me) {
    placeAt(me, SPAWN);
  }
  crowd.forEach((p, i) => {
    const s = WANDER_SPOTS[i % WANDER_SPOTS.length];
    placeAt(p, { x: s.x + ((i * 17) % 30) - 15, y: s.y + ((i * 23) % 24) - 12 });
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the hillside changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  if (k >= 1) {
    offering.show(offering.total);
    lad.variant = null;
    placeAt(lad, ROCK_USE);
  }
  if (k >= 2 && k <= 4) {
    crowd.forEach(p => {
      placeAt(p, p.seat);
      sitAt(p, p.seat);
    });
  }
  if (k === 3 || k === 4) {
    store.forEach(b => {
      b.state = "store";
      b.show();
    });
    glow.g.alpha = k === 3 ? 0.9 : 0;
  }
  if (k === 5) {
    left.forEach(b => {
      b.state = "left";
      b.show();
    });
  }
  if (sound) {
    sound.phase(phase);
  }
  // the earlier parts were only passed through, so what was said in them is not left hanging in the air
  people.forEach(p => p.clearBubble());
  onPhase(phase);
  if (startPhase === "day") {
    dayScript();
  }

  // ---- what you can do ----
  // whatever you ask your character to do, it first stands up if it was sitting
  const doMe = fn => {
    if (me) {
      standUp(me);
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
  const sitDown = group => {
    if (!me) {
      return;
    }
    const open = SEATS.filter(s => (!group || s.group === group.id) && !occupant.has(s.id)).sort(
      (a, b) => dist(a, me) - dist(b, me)
    )[0];
    if (!open) {
      onHint("There is no room left in that company.");
      return;
    }
    doMe(async stale => {
      await go(me, open, stale);
      sitAt(me, open);
    });
  };
  const passBread = () => {
    if (!me) {
      return;
    }
    if (phase !== "feed") {
      onHint(
        phase === "gather"
          ? "Everyone has been fed."
          : "The bread is ready once it has been blessed."
      );
      return;
    }
    const g = nextGroup();
    if (!g) {
      onHint("Every company is being fed.");
      return;
    }
    doMe(async stale => {
      await serveGroup(me, g, stale);
      if (!stale()) {
        pose(me, "cheer", 1200);
      }
    });
  };
  const gatherBasket = () => {
    if (!me) {
      return;
    }
    if (phase !== "gather") {
      onHint("There is nothing left over yet.");
      return;
    }
    const b = nearestBasket(left, "left", me);
    if (!b) {
      onHint("Every basket has been gathered.");
      return;
    }
    doMe(async stale => {
      await collect(me, b, stale);
      if (!stale()) {
        pose(me, "cheer", 800);
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
      return greetPerson(hit);
    }
    const basket = left.find(
      b => b.g.visible && b.state === "left" && Math.hypot(p.x - b.def.x, p.y - b.def.y) < 18
    );
    if (basket && phase === "gather") {
      return doMe(async stale => {
        await collect(me, basket, stale);
        if (!stale()) {
          pose(me, "cheer", 800);
        }
      });
    }
    if (
      phase === "feed" &&
      store.some(b => b.state === "store" && Math.hypot(p.x - b.def.x, p.y - b.def.y) < 18)
    ) {
      return passBread();
    }
    const company = GROUPS.find(
      g => ((p.x - g.x) / (g.rx + 14)) ** 2 + ((p.y - g.y - 4) / (g.ry + 14)) ** 2 < 1
    );
    if (company) {
      return phase === "feed" && served[company.id] < SERVINGS ? passBread() : sitDown(company);
    }
    if (
      p.x > ROCK.x - 6 &&
      p.x < ROCK.x + ROCK.w + 6 &&
      p.y > ROCK.y - 6 &&
      p.y < ROCK.y + ROCK.h + 6
    ) {
      return doMe(async stale => {
        await go(me, ROCK_USE, stale);
        say(me, "Five barley loaves and two small fishes: all that the lad had.", 3600);
      });
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
    sitDown: () => sitDown(null),
    passBread,
    gatherBasket,
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
