import { createActor } from "xstate";
import { directorMachine, PARTS, MS } from "@/lib/capernaum/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/capernaum/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, NET, FISH, FOLLOWERS } from "@/lib/capernaum/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawShore, drawBoat, makeHeap, drawNetLying, makeNetRing, makeLight } from "./hall.js";

const SILVER = 0xdff2fa;
const GOLD = 0xffe9a0;
// where someone stands to follow the light along the shore: just behind it, one a little further back than the next
const trail = (pt, i) => ({ x: pt.x - 30 + i * 22, y: pt.y + 30 + i * 10 });

// Starts "Fishers of men" in `canvas`. Returns a controller to steer it and to tear it down. The things every scene shares
// come from the kit; this is the shore: nets cast into the shallows and hauled in, nets mended beside the boat, and the
// light that stands for Jesus walking along the sand and calling four fishermen to follow.
export async function startCapernaum({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "shore",
  hooks = {},
  reduced = false
}) {
  const { BOAT, NET_SPOTS, FISHERS, MEND_SPOTS, FOLLOW_SPOTS, LIGHT_PATH, WANDER_SPOTS, SPAWN } =
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

  // ---- the shore ----
  ground.addChild(drawShore(layout));
  layer.addChild(drawBoat(BOAT));
  const heaps = MEND_SPOTS.map(spot => {
    const h = makeHeap(spot);
    layer.addChild(h.g);
    return { spot, heap: h, claimed: false };
  });
  const light = makeLight();
  ground.addChild(light.g);

  // ---- the people ----
  await kit.addPeople(everyone(cast), () => [...BASIC, "net", "fish"], { net: NET, fish: FISH });
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  const fishers = FOLLOWERS.map(id => byId[id]);
  const [peter, andrew, james, john] = fishers;
  const zebedee = byId.zebedee;
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });

  // ---- the light that is Jesus walking: it moves along the shore, and the town turn to watch it ----
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
  let phase = "shore";
  let fish = 0;
  let mended = 0;
  const following = new Set();
  const claimedNets = new Set();
  const lying = new Map();
  const report = () => {
    if (phase === "leave") {
      status(
        following.size >= FOLLOWERS.length
          ? "They left everything and followed him."
          : `Following him: ${following.size}`
      );
    } else {
      status(`Fish caught: ${fish} · Nets mended: ${mended} of ${heaps.length}`);
    }
  };
  kit.frame.push(() => {
    town.forEach(p => {
      if (!p.path.length) {
        p.face = L.x >= p.x ? 1 : -1;
      }
    });
  });

  // ---- behaviour for the town: they stroll the sand, watch and talk ----
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

  // ---- casting and hauling a net ----
  const nearestSpot = from =>
    NET_SPOTS.filter(s => !claimedNets.has(s)).sort((a, b) => dist(a, from) - dist(b, from))[0];
  // Goes to a place in the shallows, flings the net out, lets it sink, and hauls it in. `count` says whether the catch is
  // counted (it is for you; the fishermen are only casting).
  async function castAt(p, spot, stale, count) {
    claimedNets.add(spot);
    const ring = makeNetRing(spot.x, spot.y - 20);
    try {
      await go(p, spot, stale);
      p.variant = "net";
      pose(p, "cheer", 600);
      snd.cast();
      ground.addChild(ring);
      ring.scale.set(0.2);
      ring.alpha = 0.95;
      await tween(900, t => {
        if (!ring.destroyed) {
          ring.scale.set(0.2 + 0.8 * t);
        }
      });
      await pause(1000, stale);
      // haul it in
      await tween(700, t => {
        if (!ring.destroyed) {
          ring.scale.set(1 - 0.8 * t);
          ring.alpha = 0.95 - 0.5 * t;
        }
      });
      if (stale()) {
        return;
      }
      p.variant = "fish";
      const caught = hash(p.id + Math.floor(S.clock)) % 2 ? 2 : 1;
      for (let k = 0; k < caught; k++) {
        spawnSparkle(spot.x + (k - 0.5) * 12, spot.y - 22, SILVER);
      }
      snd.catchFish();
      if (count) {
        fish += caught;
        report();
      }
      await pause(900, stale);
    } finally {
      claimedNets.delete(spot);
      if (!ring.destroyed) {
        ring.destroy();
      }
      p.variant = null;
    }
  }

  // ---- mending a net ----
  const nextHeap = from =>
    heaps
      .filter(h => !h.heap.mended && !h.claimed)
      .sort((a, b) => dist(a.spot, from) - dist(b.spot, from))[0];
  async function mendOne(p, stale) {
    const h = nextHeap(p);
    if (!h) {
      return false;
    }
    h.claimed = true;
    try {
      await go(p, h.spot, stale);
      pose(p, "dance", 1900);
      await pause(2000, stale);
      h.heap.set(true);
      mended++;
      snd.mended();
      spawnSparkle(h.spot.x, h.spot.y - 18, GOLD);
      report();
      return true;
    } finally {
      h.claimed = false;
    }
  }

  // ---- following him ----
  const follow = (p, pt, stale) => go(p, pt, stale);
  const dropNet = p => {
    if (lying.has(p.id)) {
      return;
    }
    const n = drawNetLying(p.x, p.y);
    ground.addChild(n);
    lying.set(p.id, n);
    p.variant = null;
  };

  // ---- the parts of the story ----
  const scripts = {
    shore: () => {
      status("");
      fish = 0;
      mended = 0;
      following.clear();
      claimedNets.clear();
      heaps.forEach(h => {
        h.heap.set(false);
        h.claimed = false;
      });
      lying.forEach(n => n.destroy());
      lying.clear();
      fishers.forEach((p, i) => {
        p.stop();
        p.variant = null;
        p.walkTo(find(p, i < 2 ? FISHERS[i] : MEND_SPOTS[i - 2]));
      });
      zebedee.walkTo(find(zebedee, MEND_SPOTS[2]));
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
      fadeLight(1, 1600);
      lightTo(LIGHT_PATH[1], MS.shore);
      // Simon called Peter, and Andrew his brother, casting a net into the sea
      [peter, andrew].forEach((p, i) =>
        run(async stale => {
          await pause(600 + i * 900, stale);
          while (!stale()) {
            await castAt(p, nearestSpot(FISHERS[i]) || NET_SPOTS[i], stale, false);
            await pause(600, stale);
          }
        })
      );
      // and the others at the boat are busy with their nets
      [james, john, zebedee].forEach((p, i) =>
        run(async stale => {
          await pause(500 + i * 700, stale);
          while (!stale()) {
            pose(p, "dance", 1500);
            await pause(3400, stale);
          }
        })
      );
      run(async stale => {
        await pause(2500, stale);
        say(peter, lineFor("peter", "shore"), 3200);
        await pause(2800, stale);
        say(zebedee, lineFor("zebedee", "shore"), 3200);
      });
    },
    call: () => {
      fadeLight(1, 600);
      run(async stale => {
        await pause(1800, stale);
        // Follow me, and I will make you fishers of men
        snd.follow();
        spawnSparkle(L.x, L.y - 40, GOLD);
        await pause(1600, stale);
        // and they straightway left their nets, and followed him
        [peter, andrew].forEach(dropNet);
        say(peter, lineFor("peter", "call", 1), 3000);
        say(andrew, lineFor("andrew", "call"), 3000);
        await pause(1400, stale);
        lightTo(LIGHT_PATH[2], 7000);
        [peter, andrew].forEach((p, i) =>
          run(async s2 => {
            await follow(p, trail(LIGHT_PATH[2], i), s2);
            following.add(p.id);
          })
        );
        await pause(1400, stale);
        say(james, lineFor("james", "call"), 3200);
        say(town[0], lineFor("guest", "call", 0), 3200);
      });
    },
    boat: () => {
      fadeLight(1, 600);
      [peter, andrew].forEach((p, i) => {
        dropNet(p);
        p.walkTo(find(p, trail(LIGHT_PATH[2], i)));
      });
      setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
      // in a ship with Zebedee their father, mending their nets
      [james, john, zebedee].forEach((p, i) =>
        run(async stale => {
          await pause(500 + i * 500, stale);
          while (!stale()) {
            if (!(await mendOne(p, stale))) {
              await pause(1500, stale);
            }
            await pause(500, stale);
          }
        })
      );
      run(async stale => {
        await pause(4200, stale);
        // and he called them
        snd.follow();
        spawnSparkle(L.x, L.y - 40, GOLD);
        james.face = L.x >= james.x ? 1 : -1;
        john.face = L.x >= john.x ? 1 : -1;
        say(john, lineFor("john", "boat"), 3200);
        await pause(1800, stale);
        say(james, lineFor("james", "boat"), 3200);
        say(zebedee, lineFor("zebedee", "boat"), 3200);
        say(peter, lineFor("peter", "boat"), 3200);
      });
    },
    leave: () => {
      report();
      [peter, andrew].forEach(p => following.add(p.id));
      lightTo(LIGHT_PATH[3], 9000);
      run(async stale => {
        // and they immediately left the ship and their father, and followed him
        [james, john].forEach(dropNet);
        say(zebedee, lineFor("zebedee", "leave"), 3600);
        zebedee.face = L.x >= zebedee.x ? 1 : -1;
        pose(zebedee, "wave", 3000);
        say(john, lineFor("john", "leave"), 3000);
        await pause(1200, stale);
        fishers.forEach((p, i) =>
          run(async s2 => {
            await pause(i * 700, s2);
            await follow(p, FOLLOW_SPOTS[i], s2);
            following.add(p.id);
            report();
            if (following.size >= FOLLOWERS.length) {
              snd.cheer();
              fishers.forEach(q => pose(q, "cheer", 2000));
              town.forEach(q => pose(q, "wave", 2200));
            }
          })
        );
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

  // ---- the first moment: the fishermen are at their work, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(peter, FISHERS[0]);
  placeAt(andrew, FISHERS[1]);
  placeAt(james, MEND_SPOTS[0]);
  placeAt(john, MEND_SPOTS[1]);
  placeAt(zebedee, MEND_SPOTS[2]);
  if (me) {
    placeAt(me, SPAWN);
  }
  town.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the shore changed shape), so carry on from where the story was
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
  if (k >= 2) {
    [peter, andrew].forEach((p, i) => {
      placeAt(p, trail(LIGHT_PATH[2], i));
      dropNet(p);
      following.add(p.id);
    });
    setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
  }
  if (k === 3) {
    fishers.forEach((p, i) => {
      placeAt(p, FOLLOW_SPOTS[i]);
      dropNet(p);
      following.add(p.id);
    });
    setLight(LIGHT_PATH[3].x, LIGHT_PATH[3].y);
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
  const castNet = () => {
    if (!me) {
      return;
    }
    if (phase === "leave") {
      onHint("They have left their nets to follow him.");
      return;
    }
    const spot = nearestSpot(me);
    if (!spot) {
      onHint("Every place at the water is taken. Wait a moment.");
      return;
    }
    toMe(async stale => {
      await castAt(me, spot, stale, true);
      if (!stale()) {
        pose(me, "cheer", 700);
      }
    });
  };
  const mendNet = () => {
    if (!me) {
      return;
    }
    if (phase === "leave") {
      onHint("They have left their nets, and their father, to follow him.");
      return;
    }
    if (!nextHeap(me)) {
      onHint(mended >= heaps.length ? "Every net is mended." : "Someone is mending the last one.");
      return;
    }
    toMe(async stale => {
      await mendOne(me, stale);
    });
  };
  const followHim = () => {
    if (!me) {
      return;
    }
    if (phase === "shore") {
      onHint("He has not called anyone yet. Watch the shore.");
      return;
    }
    toMe(async stale => {
      const spot =
        phase === "leave"
          ? { x: FOLLOW_SPOTS[1].x - 32, y: FOLLOW_SPOTS[1].y + 22 }
          : trail(LIGHT_PATH[2], 2);
      await follow(me, spot, stale);
      following.add(me.id);
      me.face = L.x >= me.x ? 1 : -1;
      say(me, "I will follow him too.", 3000);
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
    if (p.y > layout.SEA_Y && p.y < layout.SAND_Y) {
      return castNet();
    }
    if (
      p.x > BOAT.x - 6 &&
      p.x < BOAT.x + BOAT.w + 6 &&
      p.y > BOAT.y - 6 &&
      p.y < BOAT.y + BOAT.h + 30
    ) {
      return mendNet();
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
    castNet,
    mendNet,
    follow: followHim,
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
