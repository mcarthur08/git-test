import { createActor } from "xstate";
import { directorMachine, PARTS, MS } from "@/lib/caesarea/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/caesarea/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, STONE, KEYS, DISCIPLES } from "@/lib/caesarea/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawCliffs, drawRock, makeStone, makeLight } from "./hall.js";

const WATER = 0xbfe9fa;
const GOLD = 0xffe9a0;
const inBox = (p, b, pad) =>
  p.x > b.x - pad && p.x < b.x + b.w + pad && p.y > b.y - pad && p.y < b.y + b.h + pad;

// Starts "Thou art the Christ" in `canvas`. Returns a controller to steer it and to tear it down. The things every scene
// shares come from the kit; this is the foot of the cliffs: a drink from the spring, stones laid on the great rock, Peter's
// answer, and the light that stands for Jesus walking among his disciples.
export async function startCaesarea({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "ask",
  hooks = {},
  reduced = false
}) {
  const { ROCK, SPRING, SPRING_SPOTS, STONE_SPOTS, BUILD_SPOTS, GROUP_SPOTS, PETER_SPOT } = layout;
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

  // ---- the cliffs ----
  ground.addChild(drawCliffs(layout));
  layer.addChild(drawRock(ROCK));
  const stones = STONE_SPOTS.map((spot, i) => {
    const s = makeStone(spot, i, ROCK);
    layer.addChild(s.g);
    return { spot, stone: s, claimed: false };
  });
  const light = makeLight();
  ground.addChild(light.g);

  // ---- the people ----
  await kit.addPeople(everyone(cast), () => [...BASIC, "stone", "keys"], {
    stone: STONE,
    keys: KEYS
  });
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  const disciples = DISCIPLES.map(id => byId[id]);
  const [peter, andrew, james, john] = disciples;
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });

  // ---- the light that is Jesus walking: it moves among the disciples, and everyone turns to watch it ----
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
  let phase = "ask";
  let drinks = 0;
  let laid = 0;
  const claimedDrinks = new Set();
  const report = () => {
    if (phase === "keys") {
      status("The keys of the kingdom are given to Peter.");
    } else {
      status(`Stones laid: ${laid} of ${stones.length} · Drinks at the spring: ${drinks}`);
    }
  };
  kit.frame.push(() => {
    town.forEach(p => {
      if (!p.path.length) {
        faceLight(p);
      }
    });
  });

  // ---- behaviour for the town: they stroll the grass, watch and talk ----
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

  // ---- drinking at the spring ----
  const nearestDrink = from =>
    SPRING_SPOTS.filter(s => !claimedDrinks.has(s)).sort(
      (a, b) => dist(a, from) - dist(b, from)
    )[0];
  // `count` says whether the drink is counted (it is for you; the others are only at the water)
  async function drinkAt(p, spot, stale, count) {
    claimedDrinks.add(spot);
    try {
      await go(p, spot, stale);
      p.face = 1;
      pose(p, "wave", 1500);
      await pause(900, stale);
      snd.drink();
      spawnSparkle(spot.x, SPRING.y + SPRING.h - 4, WATER);
      if (count) {
        drinks++;
        report();
      }
      await pause(800, stale);
    } finally {
      claimedDrinks.delete(spot);
    }
  }

  // ---- laying stones on the rock ----
  const nextStone = from =>
    stones
      .filter(s => !s.stone.laid && !s.claimed)
      .sort((a, b) => dist(a.spot, from) - dist(b.spot, from))[0];
  async function layOne(p, stale) {
    const s = nextStone(p);
    if (!s) {
      return false;
    }
    s.claimed = true;
    try {
      await go(p, s.spot, stale);
      p.variant = "stone";
      s.stone.g.visible = false;
      await go(p, BUILD_SPOTS[stones.indexOf(s)], stale);
      if (stale()) {
        return false;
      }
      pose(p, "cheer", 700);
      s.stone.set(true);
      laid++;
      snd.stone();
      spawnSparkle(ROCK.x + ROCK.w / 2, ROCK.y - 14, GOLD);
      report();
      return true;
    } finally {
      s.claimed = false;
      p.variant = null;
      s.stone.g.visible = true;
    }
  }
  const layAllStones = () => {
    stones.forEach(s => s.stone.set(true));
    laid = stones.length;
  };

  // ---- the parts of the story ----
  const scripts = {
    ask: () => {
      status("");
      drinks = 0;
      laid = 0;
      claimedDrinks.clear();
      stones.forEach(s => {
        s.stone.set(false);
        s.claimed = false;
      });
      disciples.forEach((p, i) => {
        p.stop();
        p.variant = null;
        p.walkTo(find(p, GROUP_SPOTS[i]));
      });
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
      fadeLight(1, 1600);
      lightTo(LIGHT_PATH[1], MS.ask);
      run(async stale => {
        await pause(2800, stale);
        // he asked his disciples, saying, Whom do men say that I am?
        snd.confess();
        spawnSparkle(L.x, L.y - 40, GOLD);
        disciples.forEach(faceLight);
        await pause(2200, stale);
        say(john, lineFor("john", "ask"), 3200);
        await pause(1800, stale);
        say(peter, lineFor("peter", "ask"), 3200);
        say(town[0], lineFor("guest", "ask", 0), 3200);
      });
    },
    say: () => {
      fadeLight(1, 600);
      run(async stale => {
        // some say John the Baptist; some, Elias; and others, Jeremias, or one of the prophets
        await pause(1200, stale);
        say(andrew, lineFor("andrew", "say"), 3400);
        await pause(2400, stale);
        say(john, lineFor("john", "say"), 3400);
        await pause(2400, stale);
        say(james, lineFor("james", "say"), 3400);
        say(town[1], lineFor("guest", "say", 1), 3400);
        await pause(2600, stale);
        say(peter, lineFor("peter", "say"), 3000);
      });
    },
    confess: () => {
      fadeLight(1, 600);
      lightTo(LIGHT_PATH[2], 6000);
      run(async stale => {
        await pause(1600, stale);
        // But whom say ye that I am? And Simon Peter answered
        peter.walkTo(find(peter, PETER_SPOT));
        await pause(3600, stale);
        faceLight(peter);
        snd.confess();
        say(peter, lineFor("peter", "confess"), 4600);
        spawnSparkle(peter.x, peter.y - 80, GOLD);
        await pause(2200, stale);
        say(andrew, lineFor("andrew", "confess"), 3000);
        say(john, lineFor("john", "confess"), 3000);
        say(town[2], lineFor("guest", "confess", 2), 3000);
      });
    },
    rock: () => {
      fadeLight(1, 600);
      // upon this rock I will build my church: everyone who is not busy sets stones on it
      [andrew, james, john].forEach((p, i) =>
        run(async stale => {
          await pause(1200 + i * 900, stale);
          while (!stale() && (await layOne(p, stale))) {
            await pause(500, stale);
          }
        })
      );
      run(async stale => {
        await pause(1500, stale);
        say(peter, lineFor("peter", "rock"), 3600);
        await pause(2400, stale);
        say(james, lineFor("james", "rock"), 3000);
        say(town[3], lineFor("guest", "rock", 3), 3000);
      });
    },
    keys: () => {
      layAllStones();
      report();
      lightTo(LIGHT_PATH[3], 9000);
      run(async stale => {
        // the keys of the kingdom of heaven
        await pause(800, stale);
        faceLight(peter);
        peter.variant = "keys";
        snd.keys();
        spawnSparkle(peter.x, peter.y - 70, GOLD);
        say(peter, lineFor("peter", "keys", 1), 3600);
        await pause(2400, stale);
        // then charged he his disciples that they should tell no man
        say(andrew, lineFor("andrew", "keys"), 3200);
        say(john, lineFor("john", "keys"), 3200);
        await pause(1800, stale);
        say(james, lineFor("james", "keys"), 3000);
        snd.cheer();
        town.forEach(q => pose(q, "wave", 2200));
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

  // ---- the first moment: the disciples stand together by the spring, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  disciples.forEach((p, i) => placeAt(p, GROUP_SPOTS[i]));
  if (me) {
    placeAt(me, SPAWN);
  }
  town.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the place changed shape), so carry on from where the story was
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
    placeAt(peter, PETER_SPOT);
    setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
  }
  if (k === 4) {
    layAllStones();
    peter.variant = "keys";
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
  const drinkSpring = () => {
    if (!me) {
      return;
    }
    const spot = nearestDrink(me);
    if (!spot) {
      onHint("Every place at the water is taken. Wait a moment.");
      return;
    }
    toMe(async stale => {
      await drinkAt(me, spot, stale, true);
    });
  };
  const layStone = () => {
    if (!me) {
      return;
    }
    if (phase === "ask" || phase === "say" || phase === "confess") {
      onHint("Wait until he speaks of the rock.");
      return;
    }
    if (!nextStone(me)) {
      onHint(laid >= stones.length ? "Every stone is laid." : "Someone is laying the last one.");
      return;
    }
    toMe(async stale => {
      await layOne(me, stale);
    });
  };
  const confess = () => {
    if (!me) {
      return;
    }
    if (phase === "ask" || phase === "say") {
      onHint("He has not asked you yet. Listen to the question.");
      return;
    }
    toMe(async stale => {
      await go(me, { x: LIGHT_PATH[2].x - 30, y: LIGHT_PATH[2].y + 26 }, stale);
      faceLight(me);
      snd.confess();
      spawnSparkle(L.x, L.y - 40, GOLD);
      say(me, "Thou art the Christ, the Son of the living God.", 4200);
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
    if (inBox(p, SPRING, 8)) {
      return drinkSpring();
    }
    if (inBox(p, ROCK, 6)) {
      return layStone();
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
    drinkSpring,
    layStone,
    confess,
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
