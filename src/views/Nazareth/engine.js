import { createActor } from "xstate";
import { directorMachine, PARTS, MS } from "@/lib/nazareth/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/nazareth/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, HAMMER, STAFF, SCROLL } from "@/lib/nazareth/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import {
  drawVillage,
  drawHouse,
  drawShop,
  drawCourt,
  makeBoards,
  makeBundle,
  makeLight
} from "./hall.js";

const GOLD = 0xffe9a0;
const MIST = 0xcfdcf0;
// where someone stands to walk home behind the light: just behind it, one a little further along than the next
const trail = (pt, i) => ({ x: pt.x - 26 + i * 26, y: pt.y + 26 });
// what is called out along the road, by who calls
const CALLS = ["Have you seen the boy?", "Has anyone seen our son?"];

// Starts "Growing up in Nazareth" in `canvas`. Returns a controller to steer it and to tear it down. The things every scene
// shares come from the kit; this is the village: boards planed in the workshop, bundles packed for the feast, a search along
// the road, and the light that stands for Jesus, at the workshop, among the teachers, and home again.
export async function startNazareth({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "home",
  hooks = {},
  reduced = false
}) {
  const {
    HOUSE,
    SHOP,
    COURT,
    BOARD_SPOTS,
    BUNDLE_SPOTS,
    SEEK_SPOTS,
    TEACHER_SPOTS,
    VISIT_SPOTS,
    ROAD_FAR,
    LIGHT_PATH,
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
  const { spawnSparkle, toMe } = kit;

  // ---- the village ----
  ground.addChild(drawVillage(layout));
  layer.addChild(drawHouse(HOUSE), drawShop(SHOP), drawCourt(COURT));
  const boards = BOARD_SPOTS.map(spot => {
    const b = makeBoards(spot);
    layer.addChild(b.g);
    return { spot, item: b, claimed: false };
  });
  const bundles = BUNDLE_SPOTS.map(spot => {
    const b = makeBundle(spot);
    layer.addChild(b.g);
    return { spot, item: b, claimed: false };
  });
  const light = makeLight();
  ground.addChild(light.g);

  // ---- the people ----
  const held = { hammer: HAMMER, staff: STAFF, scroll: SCROLL };
  const variantsFor = c =>
    c.kind === "teacher"
      ? [...BASIC, "scroll"]
      : c.kind === "mary"
      ? BASIC
      : [...BASIC, "hammer", "staff"];
  await kit.addPeople(everyone(cast), variantsFor, held);
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  const { joseph, mary } = byId;
  const teachers = people.filter(p => p.char.kind === "teacher");
  const family = [joseph, mary];
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });

  // ---- the light that is Jesus: it moves about, and those who are free turn to watch it ----
  const L = { x: LIGHT_PATH[0].x, y: LIGHT_PATH[0].y };
  let lightTrip = 0;
  const setLight = (x, y, a) => {
    L.x = x;
    L.y = y;
    light.g.position.set(x, y);
    if (a !== undefined) {
      light.g.alpha = a;
    }
  };
  // a newer trip replaces an older one, so two parts never pull the light two ways
  const lightTo = (pt, ms) => {
    const id = ++lightTrip;
    const { x, y } = L;
    return tween(ms, t => {
      if (id === lightTrip) {
        setLight(x + (pt.x - x) * t, y + (pt.y - y) * t);
      }
    });
  };
  const fadeLight = (to, ms) => {
    const from = light.g.alpha;
    return tween(ms, t => {
      light.g.alpha = from + (to - from) * t;
    });
  };

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "home";
  let planed = 0;
  let packed = 0;
  const searched = new Set();
  const claimedSeek = new Set();
  const report = () => {
    if (phase === "lost") {
      status(`Places searched: ${searched.size} of ${SEEK_SPOTS.length}`);
    } else if (phase === "found") {
      status("They found him in the temple.");
    } else {
      status(
        `Boards planed: ${planed} of ${boards.length} · Bundles packed: ${packed} of ${bundles.length}`
      );
    }
  };
  kit.frame.push(() => {
    [...town, ...teachers].forEach(p => {
      if (!p.path.length) {
        p.face = L.x >= p.x ? 1 : -1;
      }
    });
  });

  // ---- behaviour for the town: they stroll the village, watch and talk ----
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

  // ---- planing a board ----
  const nextOf = (list, from) =>
    list
      .filter(h => !h.item[list === boards ? "planed" : "tied"] && !h.claimed)
      .sort((a, b) => dist(a.spot, from) - dist(b.spot, from))[0];
  // Goes to a heap of boards and planes it smooth. Gives false if there is none left to plane.
  async function planeOne(p, stale) {
    const h = nextOf(boards, p);
    if (!h) {
      return false;
    }
    h.claimed = true;
    try {
      await go(p, h.spot, stale);
      p.variant = "hammer";
      pose(p, "dance", 1900);
      snd.plane();
      await pause(2000, stale);
      if (stale()) {
        return false;
      }
      h.item.set(true);
      planed++;
      spawnSparkle(h.spot.x, h.spot.y - 18, GOLD);
      report();
      return true;
    } finally {
      h.claimed = false;
      p.variant = null;
    }
  }

  // ---- packing a bundle ----
  async function packOne(p, stale) {
    const h = nextOf(bundles, p);
    if (!h) {
      return false;
    }
    h.claimed = true;
    try {
      await go(p, h.spot, stale);
      pose(p, "dance", 1500);
      await pause(1600, stale);
      if (stale()) {
        return false;
      }
      h.item.set(true);
      packed++;
      snd.tie();
      spawnSparkle(h.spot.x, h.spot.y - 18, GOLD);
      report();
      return true;
    } finally {
      h.claimed = false;
    }
  }

  // ---- looking for him along the road ----
  const nextSeek = from =>
    SEEK_SPOTS.filter(s => !searched.has(s) && !claimedSeek.has(s)).sort(
      (a, b) => dist(a, from) - dist(b, from)
    )[0];
  async function seekOne(p, stale) {
    const spot = nextSeek(p);
    if (!spot) {
      return false;
    }
    claimedSeek.add(spot);
    try {
      await go(p, spot, stale);
      snd.calling();
      pose(p, "wave", 1600);
      say(p, p === me ? "Has anyone seen the boy?" : CALLS[hash(p.id + spot.x) % 2], 2800);
      spawnSparkle(spot.x, spot.y - 20, MIST);
      await pause(1800, stale);
      if (stale()) {
        return false;
      }
      searched.add(spot);
      report();
      return true;
    } finally {
      claimedSeek.delete(spot);
    }
  }

  // ---- the parts of the story ----
  const faceLight = p => {
    p.face = L.x >= p.x ? 1 : -1;
  };
  const resetChores = () => {
    planed = 0;
    packed = 0;
    searched.clear();
    claimedSeek.clear();
    [...boards, ...bundles].forEach(h => {
      h.item.set(false);
      h.claimed = false;
    });
  };
  const atWork = (p, spot, ms) =>
    run(async stale => {
      p.walkTo(find(p, spot));
      await pause(ms, stale);
      while (!stale()) {
        if (!(await planeOne(p, stale))) {
          await pause(1500, stale);
        }
        await pause(500, stale);
      }
    });
  const scripts = {
    home: () => {
      status("");
      resetChores();
      family.forEach(p => {
        p.stop();
        p.variant = null;
      });
      teachers.forEach((p, i) => p.walkTo(find(p, TEACHER_SPOTS[i])));
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
      fadeLight(1, 1600);
      // the child grew, and waxed strong in spirit: Joseph is at his boards, and the light is at the workshop
      atWork(joseph, BOARD_SPOTS[0], 400);
      mary.walkTo(find(mary, BUNDLE_SPOTS[1]));
      run(async stale => {
        await pause(900, stale);
        while (!stale()) {
          pose(mary, "dance", 1500);
          await pause(3600, stale);
        }
      });
      run(async stale => {
        await pause(2500, stale);
        say(joseph, lineFor("joseph", "home"), 3200);
        await pause(2800, stale);
        say(mary, lineFor("mary", "home"), 3200);
      });
      report();
    },
    feast: () => {
      fadeLight(1, 600);
      // his parents went up every year: the bundles are packed, then the family sets out for the court
      family.forEach((p, i) =>
        run(async stale => {
          const until = S.clock + 5500;
          await pause(300 + i * 600, stale);
          while (!stale() && S.clock < until && (await packOne(p, stale))) {
            await pause(300, stale);
          }
          p.variant = "staff";
          await go(p, VISIT_SPOTS[i], stale);
        })
      );
      run(async stale => {
        await lightTo(LIGHT_PATH[1], 2200);
        if (stale()) {
          return;
        }
        // when he was twelve years old, they went up to Jerusalem
        await lightTo(LIGHT_PATH[2], MS.feast - 3600);
      });
      run(async stale => {
        await pause(2400, stale);
        say(mary, lineFor("mary", "feast"), 3200);
        await pause(2600, stale);
        say(joseph, lineFor("joseph", "feast", 1), 3200);
      });
      report();
    },
    lost: () => {
      fadeLight(1, 600);
      // the child Jesus tarried behind: the light stays in the court while they walk a day's journey away
      lightTo(LIGHT_PATH[2], 600);
      claimedSeek.clear();
      searched.clear();
      family.forEach((p, i) =>
        run(async stale => {
          await pause(1200 + i * 600, stale);
          p.variant = "staff";
          say(p, lineFor(i ? "mary" : "joseph", "lost", 0), 3200);
          await go(p, { x: ROAD_FAR.x - i * 28, y: ROAD_FAR.y }, stale);
          // and they sought him among their kinsfolk and acquaintance, then turned back, seeking him
          await pause(900, stale);
          while (!stale() && (await seekOne(p, stale))) {
            await pause(200, stale);
          }
          await go(p, VISIT_SPOTS[i], stale);
        })
      );
      run(async stale => {
        await pause(9000, stale);
        say(town[0], lineFor("guest", "lost", 0), 3200);
      });
      report();
    },
    found: () => {
      fadeLight(1, 600);
      lightTo(LIGHT_PATH[2], 400);
      family.forEach((p, i) => {
        p.stop();
        p.variant = null;
        p.walkTo(find(p, VISIT_SPOTS[i]));
      });
      report();
      run(async stale => {
        // after three days they found him in the temple, sitting in the midst of the doctors
        snd.found();
        spawnSparkle(L.x, L.y - 40, GOLD);
        await pause(1800, stale);
        family.forEach(faceLight);
        say(teachers[0], lineFor("teacher", "found", 0), 3200);
        await pause(2400, stale);
        // his mother said unto him, Son, why hast thou thus dealt with us?
        say(mary, lineFor("mary", "found", 0), 3600);
        pose(mary, "wave", 1800);
        await pause(2800, stale);
        say(joseph, lineFor("joseph", "found"), 3200);
        say(teachers[1], lineFor("teacher", "found", 1), 3200);
        await pause(1600, stale);
        town.forEach(q => pose(q, "wave", 1800));
      });
    },
    grow: () => {
      family.forEach(p => {
        p.variant = null;
      });
      report();
      // and he went down with them, and came to Nazareth, and was subject unto them
      lightTo(LIGHT_PATH[3], 9000);
      run(async stale => {
        say(mary, lineFor("mary", "grow"), 3600);
        await pause(1200, stale);
        await go(mary, trail(LIGHT_PATH[3], 1), stale);
        snd.cheer();
        town.forEach(q => pose(q, "wave", 2000));
        pose(mary, "cheer", 1800);
      });
      run(async stale => {
        await pause(700, stale);
        await go(joseph, trail(LIGHT_PATH[3], 0), stale);
        say(joseph, lineFor("joseph", "grow"), 3000);
        // and Jesus increased in wisdom and stature: back to the workshop
        await pause(3000, stale);
        while (!stale()) {
          if (!(await planeOne(joseph, stale))) {
            await pause(1500, stale);
          }
          await pause(500, stale);
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

  // ---- the first moment: Joseph is at his boards, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(joseph, BOARD_SPOTS[0]);
  placeAt(mary, BUNDLE_SPOTS[1]);
  teachers.forEach((p, i) => placeAt(p, TEACHER_SPOTS[i]));
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
  if (k >= 1) {
    setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y);
  }
  if (k >= 2) {
    bundles.forEach(h => h.item.set(true));
    packed = bundles.length;
    setLight(LIGHT_PATH[2].x, LIGHT_PATH[2].y);
    family.forEach((p, i) => placeAt(p, VISIT_SPOTS[i]));
  }
  if (k === 4) {
    setLight(LIGHT_PATH[3].x, LIGHT_PATH[3].y);
    placeAt(joseph, trail(LIGHT_PATH[3], 0));
    placeAt(mary, trail(LIGHT_PATH[3], 1));
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
  const planeBoard = () => {
    if (!me) {
      return;
    }
    if (phase === "lost" || phase === "found") {
      onHint("The workshop is quiet until they come home.");
      return;
    }
    if (!nextOf(boards, me)) {
      onHint(
        planed >= boards.length ? "Every board is planed." : "Someone is planing the last one."
      );
      return;
    }
    toMe(async stale => {
      await planeOne(me, stale);
    });
  };
  const packBundle = () => {
    if (!me) {
      return;
    }
    if (phase !== "home" && phase !== "feast") {
      onHint("The feast is over, and the bundles are put away.");
      return;
    }
    if (!nextOf(bundles, me)) {
      onHint(
        packed >= bundles.length ? "Every bundle is packed." : "Someone is packing the last one."
      );
      return;
    }
    toMe(async stale => {
      await packOne(me, stale);
    });
  };
  const seekHim = () => {
    if (!me) {
      return;
    }
    if (phase !== "lost") {
      onHint(
        phase === "found"
          ? "They have found him in the temple."
          : phase === "grow"
          ? "He is home again."
          : "He is not lost yet. Watch the family."
      );
      return;
    }
    if (!nextSeek(me)) {
      onHint(
        searched.size >= SEEK_SPOTS.length
          ? "Every place is searched."
          : "Someone is looking there."
      );
      return;
    }
    toMe(async stale => {
      await seekOne(me, stale);
    });
  };
  const inside = (p, r, pad = 6) =>
    p.x > r.x - pad && p.x < r.x + r.w + pad && p.y > r.y - pad && p.y < r.y + r.h + 30;
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
    if (inside(p, SHOP)) {
      return planeBoard();
    }
    if (inside(p, HOUSE)) {
      return packBundle();
    }
    if (inside(p, COURT)) {
      return seekHim();
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
    planeBoard,
    packBundle,
    seek: seekHim,
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
