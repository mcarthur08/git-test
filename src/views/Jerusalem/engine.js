import { createActor } from "xstate";
import { directorMachine, PARTS, MS } from "@/lib/jerusalem/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/jerusalem/lines.js";
import { hash } from "@/lib/cana/cast.js";
import { everyone, CUP, LOAVES, JAR, DISCIPLE_IDS } from "@/lib/jerusalem/cast.js";
import { BASIC } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawRoom, drawTable, drawJar, makeSetting, makeLight } from "./hall.js";

const GOLD = 0xffe9a0;
const WINE = 0xc2425a;
const BREAD = 0xf0c987;
// how far from a guest you stand to hand them the cup or the bread
const BESIDE = 26;

// Starts "The Passover" in `canvas`. Returns a controller to steer it and to tear it down. The things every scene shares
// come from the kit; this is the upper room: places laid at the table, the disciples gathering, and the cup and the bread
// shared round it, with the light that stands for Jesus at the head of the table.
export async function startJerusalem({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "prepare",
  hooks = {},
  reduced = false
}) {
  const {
    TABLE,
    JAR: JAR_STAND,
    SEATS,
    ENTRY,
    WAIT,
    GOODMAN,
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

  // ---- the room ----
  ground.addChild(drawRoom(layout));
  layer.addChild(drawTable(TABLE));
  layer.addChild(drawJar(JAR_STAND));
  const tableZ = TABLE.y + TABLE.h + 10.5;
  const settings = SEATS.map(seat => ({
    seat,
    setting: makeSetting(seat, tableZ),
    claimed: false
  }));
  settings.forEach(s => layer.addChild(s.setting.g));
  const light = makeLight();
  ground.addChild(light.g);

  // ---- the people ----
  await kit.addPeople(
    everyone(cast),
    c =>
      c.kind === "me"
        ? [...BASIC, "cup", "bread"]
        : c.kind === "goodman"
        ? [...BASIC, "jar"]
        : BASIC,
    { cup: CUP, bread: LOAVES, jar: JAR }
  );
  const me = kit.me;
  const town = people.filter(p => p.char.kind === "guest");
  const disciples = DISCIPLE_IDS.map(id => byId[id]);
  const [john, peter, andrew, james] = disciples;
  const goodman = byId.goodman;
  town.forEach((p, i) => {
    p.home = WANDER_SPOTS[i % WANDER_SPOTS.length];
  });
  // who sits where: John and Peter nearest him, then the others, in the order of the places
  const seaters = [...disciples, ...town];
  const seatOf = new Map(seaters.map((p, i) => [p.id, SEATS[i]]));
  const settingOf = p => settings[SEATS.indexOf(seatOf.get(p.id))].setting;
  const seated = new Set();

  // ---- the light that is Jesus: it comes in at the door and stays at the head of the table ----
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
  const swellLight = (to, ms) => {
    const from = light.g.scale.x;
    return tween(ms, t => light.g.scale.set(from + (to - from) * t));
  };

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "prepare";
  const served = { cup: new Set(), bread: new Set() };
  const claimed = new Set();
  const report = () => {
    if (phase === "prepare" || phase === "gather") {
      status(`Places set: ${settings.filter(s => s.setting.on).length} of ${settings.length}`);
    } else {
      status(
        `Cups shared: ${served.cup.size} of ${seaters.length} · Bread shared: ${served.bread.size} of ${seaters.length}`
      );
    }
  };
  kit.frame.push(() => {
    town.forEach(p => {
      if (!p.path.length && !seated.has(p.id)) {
        p.face = L.x >= p.x ? 1 : -1;
      }
    });
  });

  // ---- behaviour for the other disciples: they wander the room until they take their places ----
  const roleOf = p => (p.char.kind === "me" ? "guest" : p.char.kind);
  const pickGoal = p => {
    if (seated.has(p.id)) {
      return null;
    }
    const near = town.filter(o => o !== p && !seated.has(o.id) && dist(o, p) < 90);
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
    if (!seated.has(b.id)) {
      b.face = a.x >= b.x ? 1 : -1;
    }
    pose(b, "wave", 1800);
    kit.after(900, () =>
      say(b, lineFor(roleOf(b), phase, hash(b.id + a.id + Math.floor(S.clock))), 2600)
    );
  };
  // walks to a place at the table and sits there, whatever else the story has moved on to meanwhile
  const sit = p => {
    const seat = seatOf.get(p.id);
    return p.walkTo(find({ x: p.x, y: p.y }, seat)).then(ok => {
      if (ok) {
        seated.add(p.id);
        p.face = seat.face;
      }
      return ok;
    });
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
        const arrived = goal.kind === "seat" ? sit(p) : p.walkTo(find({ x: p.x, y: p.y }, goal));
        arrived.then(ok => (ok ? actor.send({ type: "ARRIVED" }) : null));
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
  // sends one of them to their place: through their own moods if they have them
  const seatPerson = p => {
    const m = machines.get(p.id);
    if (m) {
      m.send({ type: "GOAL", goal: { kind: "seat", ...seatOf.get(p.id), ms: 1000 } });
    } else {
      sit(p);
    }
  };

  // ---- laying the places ----
  const nextSetting = from =>
    settings
      .filter(s => !s.setting.on && !s.claimed)
      .sort((a, b) => dist(a.seat, from) - dist(b.seat, from))[0];
  async function layOne(p, stale) {
    const s = nextSetting(p);
    if (!s) {
      return false;
    }
    s.claimed = true;
    try {
      await go(p, s.seat, stale);
      pose(p, "dance", 1500);
      await pause(1400, stale);
      s.setting.set(true);
      snd.place();
      spawnSparkle(s.seat.px, s.seat.py - 8, GOLD);
      report();
      return true;
    } finally {
      s.claimed = false;
    }
  }

  // ---- the cup and the bread ----
  // the next one at the table who has not had it (`kind` is "cup" or "bread"), nearest to `from`
  const needs = (kind, from) =>
    seaters
      .filter(p => seated.has(p.id) && !served[kind].has(p.id) && !claimed.has(kind + p.id))
      .sort((a, b) => dist(a, from) - dist(b, from))[0];
  const give = (kind, p) => {
    served[kind].add(p.id);
    const setting = settingOf(p);
    setting.mark(kind);
    const seat = seatOf.get(p.id);
    spawnSparkle(seat.px, seat.py - 8, kind === "cup" ? WINE : BREAD);
    if (kind === "cup") {
      snd.pour();
    } else {
      snd.brake();
    }
    report();
  };
  // he gives it round the table himself: one after another, until every one has had it
  const shareRound = kind =>
    run(async stale => {
      await pause(2200, stale);
      for (let p = needs(kind, L); p && !stale(); p = needs(kind, L)) {
        give(kind, p);
        await pause(2400, stale);
      }
    });
  // you hand it to the nearest one who has not had it
  async function handOne(kind, stale) {
    const to = needs(kind, me);
    if (!to) {
      return false;
    }
    const key = kind + to.id;
    claimed.add(key);
    try {
      me.variant = kind;
      await go(me, { x: to.x - BESIDE, y: to.y + 3 }, stale);
      me.face = to.x >= me.x ? 1 : -1;
      pose(me, "wave", 900);
      await pause(700, stale);
      give(kind, to);
      say(to, lineFor(roleOf(to), phase, hash(to.id + kind)), 2600);
      return true;
    } finally {
      claimed.delete(key);
      me.variant = null;
    }
  }

  // ---- the parts of the story ----
  const scripts = {
    prepare: () => {
      status("");
      seated.clear();
      served.cup.clear();
      served.bread.clear();
      claimed.clear();
      settings.forEach(s => {
        s.setting.set(false);
        s.claimed = false;
      });
      report();
      swellLight(1, 400);
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y, 0);
      goodman.stop();
      goodman.variant = "jar";
      goodman.walkTo(find(goodman, GOODMAN));
      [peter, john].forEach((p, i) => {
        p.stop();
        p.walkTo(find(p, ENTRY[i]));
      });
      [andrew, james].forEach((p, i) => {
        p.stop();
        p.walkTo(find(p, WAIT[i]));
      });
      // and he sent Peter and John, saying, Go and prepare us the passover
      [peter, john].forEach((p, i) =>
        run(async stale => {
          await pause(900 + i * 900, stale);
          while (!stale()) {
            if (!(await layOne(p, stale))) {
              await pause(1500, stale);
            }
            await pause(300, stale);
          }
        })
      );
      run(async stale => {
        await pause(1500, stale);
        say(goodman, lineFor("goodman", "prepare"), 3200);
        await pause(2800, stale);
        say(peter, lineFor("peter", "prepare"), 3200);
        await pause(2800, stale);
        say(andrew, lineFor("andrew", "prepare"), 3200);
      });
    },
    gather: () => {
      // they made ready the passover: every place is laid
      settings.forEach(s => s.setting.set(true));
      goodman.variant = null;
      report();
      setLight(LIGHT_PATH[0].x, LIGHT_PATH[0].y);
      fadeLight(1, 1200);
      run(async stale => {
        await pause(900, stale);
        snd.arrive();
        spawnSparkle(L.x, L.y - 40, GOLD);
        say(goodman, lineFor("goodman", "gather"), 3200);
        // when the hour was come, he sat down, and the twelve apostles with him
        lightTo(LIGHT_PATH[1], 6500);
        seaters.forEach((p, i) =>
          run(async s2 => {
            await pause(2200 + i * 500, s2);
            seatPerson(p);
          })
        );
        await pause(7500, stale);
        say(john, lineFor("john", "gather"), 3000);
        await pause(1500, stale);
        say(town[0], lineFor("guest", "gather", 1), 3000);
      });
    },
    cup: () => {
      fadeLight(1, 600);
      setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y);
      // and he took the cup, and gave thanks, and said, Take this, and divide it among yourselves
      spawnSparkle(TABLE.x + TABLE.w / 2, TABLE.y + TABLE.h / 2, GOLD);
      snd.pour();
      shareRound("cup");
      run(async stale => {
        await pause(3000, stale);
        say(peter, lineFor("peter", "cup"), 3000);
        await pause(3000, stale);
        say(james, lineFor("james", "cup"), 3000);
      });
    },
    bread: () => {
      setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y, 1);
      // and he took bread, and gave thanks, and brake it, and gave unto them
      spawnSparkle(TABLE.x + TABLE.w / 2, TABLE.y + TABLE.h / 2, BREAD);
      snd.brake();
      shareRound("bread");
      run(async stale => {
        await pause(3000, stale);
        say(john, lineFor("john", "bread"), 3000);
        await pause(3000, stale);
        say(andrew, lineFor("andrew", "bread"), 3000);
      });
    },
    supper: () => {
      setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y, 1);
      // this do in remembrance of me: the light grows, and the cup after supper goes to any who have not had it
      snd.remember();
      swellLight(1.35, 2500);
      shareRound("cup");
      run(async stale => {
        await pause(2500, stale);
        say(peter, lineFor("peter", "supper"), 3200);
        await pause(3000, stale);
        say(goodman, lineFor("goodman", "supper"), 3200);
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

  // ---- the first moment: Peter and John have just come in, and you arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(peter, ENTRY[0]);
  placeAt(john, ENTRY[1]);
  placeAt(andrew, WAIT[0]);
  placeAt(james, WAIT[1]);
  placeAt(goodman, GOODMAN);
  if (me) {
    placeAt(me, SPAWN);
  }
  town.forEach((p, i) => {
    placeAt(p, p.home);
    startPerson(p, 200 + i * 250);
  });
  // rebuilt part-way through (the room changed shape), so carry on from where the story was
  const k = PARTS.indexOf(startPhase);
  S.restoring = true;
  for (let i = 0; i < k; i++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  if (k >= 1) {
    settings.forEach(s => s.setting.set(true));
    seaters.forEach(p => {
      const seat = seatOf.get(p.id);
      placeAt(p, seat);
      p.face = seat.face;
      seated.add(p.id);
    });
    light.g.alpha = 1;
    setLight(LIGHT_PATH[1].x, LIGHT_PATH[1].y);
    if (k === 4) {
      light.g.scale.set(1.35);
    }
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
  const setTable = () => {
    if (!me) {
      return;
    }
    if (!nextSetting(me)) {
      onHint(
        settings.every(s => s.setting.on)
          ? "Every place is laid."
          : "Someone is laying the last place."
      );
      return;
    }
    toMe(async stale => {
      await layOne(me, stale);
    });
  };
  const hand = kind => {
    if (!me) {
      return;
    }
    if (PARTS.indexOf(phase) < PARTS.indexOf(kind)) {
      onHint(`Wait until he takes the ${kind}.`);
      return;
    }
    if (!needs(kind, me)) {
      onHint(
        served[kind].size >= seaters.length
          ? `Everyone has had the ${kind}.`
          : `Someone is giving out the last ${kind}.`
      );
      return;
    }
    toMe(async stale => {
      if (await handOne(kind, stale)) {
        pose(me, "cheer", 700);
      }
    });
  };
  const passCup = () => hand("cup");
  const passBread = () => hand("bread");
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
      p.x > TABLE.x - 6 &&
      p.x < TABLE.x + TABLE.w + 6 &&
      p.y > TABLE.y - 6 &&
      p.y < TABLE.y + TABLE.h + 6
    ) {
      if (phase === "prepare") {
        return setTable();
      }
      return phase === "cup" || !needs("bread", me) ? passCup() : passBread();
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
    setTable,
    passBread,
    passCup,
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
