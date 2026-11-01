import { Graphics } from "pixi.js";
import { createActor } from "xstate";
import { directorMachine, PHASES } from "@/lib/cana/story.js";
import { personMachine } from "@/lib/cana/person.js";
import { lineFor } from "@/lib/cana/lines.js";
import { hash, everyone, ITEM } from "@/lib/cana/cast.js";
import { BASIC, CARRYING, FIG } from "@/lib/cana/budget.js";
import { createKit, dist } from "@/views/play/kit.js";
import { drawFloor, drawLanterns, makeJars, tables, plants, drawCistern } from "./hall.js";

// Starts the wedding at Cana in `canvas`. Returns a controller to steer it and to tear it down. The things every scene
// shares (the drawing surface, the people, the clock, taps and sound) come from the kit; this is the wedding itself.
export async function startCana({
  canvas,
  host,
  cast,
  layout,
  sound = null,
  startPhase = "feast",
  hooks = {},
  reduced = false
}) {
  const {
    SPAWN,
    CISTERN,
    SEATS,
    DANCE_SPOTS,
    WANDER_SPOTS,
    WATCH_SPOTS,
    HEAD_SEATS,
    MARY_SPOT,
    MUSICIAN_SPOTS,
    HEAD_TABLE
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
  const kit = await createKit({ canvas, host, layout, sound, hooks, reduced });
  const { ground, layer, fx, find, S, snd, people, byId, wait, tween, run, go, pause, say, pose } =
    kit;
  const { spawnNote, spawnSparkle, toMe, walkMe } = kit;

  // ---- the courtyard ----
  ground.addChild(drawFloor(layout));
  tables(layout).forEach(t => layer.addChild(t));
  plants(layout).forEach(p => layer.addChild(p));
  layer.addChild(drawCistern(layout.CISTERN));
  const jars = makeJars(layout);
  jars.forEach(j => layer.addChild(j.g));
  const lanterns = drawLanterns(layout);
  fx.addChild(lanterns.g);
  const glows = lanterns.glows.map(l => {
    const g = new Graphics();
    g.circle(l.x, l.y, 10).fill({ color: 0xffd46a, alpha: 0.22 });
    fx.addChild(g);
    return g;
  });

  // ---- the people ----
  await kit.addPeople(
    everyone(cast),
    c =>
      c.kind === "me" || c.kind === "servant"
        ? CARRYING
        : c.kind === "musician"
        ? ["idle", "up", "up2"]
        : BASIC,
    { jar: ITEM.jar, cup: ITEM.cup }
  );
  const me = kit.me;
  const guests = people.filter(p => p.char.kind === "guest");
  const servants = people.filter(p => p.char.kind === "servant");
  const musicians = people.filter(p => p.char.kind === "musician");
  const [groom, bride, master, mary] = ["groom", "bride", "master", "mary"].map(id => byId[id]);

  // ---- the story's director ----
  const director = createActor(directorMachine).start();
  let phase = "feast";
  let celebrating = false;
  const spots = { seats: new Map(), dance: new Map() };
  const free = (map, list, near) => {
    const open = list.filter(s => !map.has(s));
    const pool = open.length ? open : list;
    return pool.slice().sort((a, b) => (near ? dist(a, near) - dist(b, near) : 0))[0];
  };

  // ---- behaviour for guests: they idle, pick something to do, go there and do it ----
  const pickGoal = (p, ctx) => {
    const r = p.rand();
    const ms = a => Math.round(a + p.rand() * a);
    if (phase === "celebrate" && r < 0.62) {
      const s = free(spots.dance, DANCE_SPOTS);
      spots.dance.set(s, p.id);
      return {
        kind: "dance",
        x: s.x + (p.rand() - 0.5) * 10,
        y: s.y + (p.rand() - 0.5) * 8,
        ms: ms(8000),
        spot: s
      };
    }
    if ((phase === "fillJars" || phase === "drawOut") && r < 0.6) {
      const s = WATCH_SPOTS[(p.rand() * WATCH_SPOTS.length) | 0];
      return { kind: "look", ...s, ms: ms(4000) };
    }
    if (r < 0.3) {
      const s = free(spots.seats, SEATS);
      spots.seats.set(s, p.id);
      return { kind: "sit", ...s, ms: ms(7000), spot: s };
    }
    if (r < 0.6) {
      const others = people.filter(o => o !== p && (o.char.kind === "guest" || o === me));
      const o = others[(p.rand() * others.length) | 0];
      if (o) {
        const side = o.x > p.x ? -1 : 1;
        return { kind: "chat", x: o.x + side * 24, y: o.y + 3, ms: 3600, partner: o.id };
      }
    }
    const s = WANDER_SPOTS[(p.rand() * WANDER_SPOTS.length) | 0];
    return { kind: "look", ...s, ms: ms(2500) };
  };
  const release = (p, goal) => {
    if (goal && goal.spot) {
      [spots.seats, spots.dance].forEach(m => {
        if (m.get(goal.spot) === p.id) {
          m.delete(goal.spot);
        }
      });
    }
  };
  const roleOf = p => (p.char.kind === "guest" || p.char.kind === "me" ? "guest" : p.char.kind);
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
    wait(900).then(
      () =>
        !S.dead && say(b, lineFor(roleOf(b), phase, hash(b.id + a.id + Math.floor(S.clock))), 2600)
    );
  };
  const machines = new Map();
  const startGuest = (p, delay) => {
    let last = "";
    const actor = createActor(personMachine, {
      input: { pick: ctx => pickGoal(p, ctx), idleMs: () => 900 + p.rand() * 3200 }
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
      if (goal) {
        p.goal = goal;
      }
      if (snap.value === "walking" && goal) {
        if (goal.kind !== "talk") {
          p.setPose("idle");
        }
        p.walkTo(find({ x: p.x, y: p.y }, goal)).then(ok =>
          ok ? actor.send({ type: "ARRIVED" }) : null
        );
      } else if (snap.value === "acting" && goal) {
        if (goal.kind === "dance") {
          pose(p, "dance", goal.ms);
        } else if (goal.kind === "chat") {
          const o = byId[goal.partner];
          if (o) {
            greet(p, o);
            const m = machines.get(o.id);
            if (m) {
              m.send({ type: "GOAL", goal: { kind: "talk", x: o.x, y: o.y, ms: 3200 } });
            }
          }
        } else if (goal.kind === "sit") {
          p.face = goal.face || 1;
        }
      } else if (snap.value === "idle") {
        p.setPose("idle");
        release(p, p.goal);
        p.goal = null;
      }
    });
    machines.set(p.id, actor);
    kit.after(delay, () => actor.start());
  };

  // ---- the servants' work ----
  const fillJar = async (p, jar, stale) => {
    jar.assigned = p.id;
    try {
      await go(p, CISTERN.use, stale);
      p.face = -1;
      snd.draw();
      await pause(700, stale);
      p.variant = "jar";
      await go(p, jar.def.pour, stale);
      await pause(450, stale);
      p.face = 1;
      snd.pour(700);
      await tween(700, t => jar.setLevel(t));
      jar.setLevel(1);
      snd.fillDone();
      if (jars.every(j => j.full)) {
        director.send({ type: "ALL_FILLED" });
      }
    } finally {
      p.variant = null;
      if (jar.assigned === p.id) {
        jar.assigned = null;
      }
    }
  };
  const nearestOpenJar = from =>
    jars
      .filter(j => !j.full && !j.assigned)
      .sort((a, b) => dist(a.def.pour, from) - dist(b.def.pour, from))[0];
  const standBy = layout.STANDBY;

  function startFilling() {
    servants.forEach((s, i) =>
      run(async stale => {
        await pause(400 + i * 900, stale);
        for (;;) {
          const jar = nearestOpenJar(s);
          if (!jar || stale()) {
            break;
          }
          await fillJar(s, jar, stale);
        }
        await go(s, standBy[i], stale);
      })
    );
  }
  function turnToWine() {
    jars.forEach((j, i) =>
      run(async stale => {
        await pause(300 + i * 380, stale);
        snd.wine(i);
        for (let k = 0; k < 6; k++) {
          spawnSparkle(j.def.x, j.def.y - 12);
        }
        await tween(1300, t => j.setWine(t));
        j.setWine(1);
      })
    );
    // a servant draws a cup and takes it to the governor of the feast
    run(async stale => {
      const s = servants[0];
      await pause(1500, stale);
      await go(s, jars[0].def.pour, stale);
      await pause(500, stale);
      s.variant = "cup";
      await go(s, { x: HEAD_SEATS.master.x, y: HEAD_TABLE.y + HEAD_TABLE.h + 18 }, stale);
      await pause(400, stale);
      s.variant = null;
      master.face = 1;
      pose(master, "cheer", 1600);
      snd.clink();
      say(master, lineFor("master", "celebrate"), 4200);
      await pause(1800, stale);
      director.send({ type: "TASTED" });
    });
  }
  function startCelebrating() {
    celebrating = true;
    snd.cheer();
    [...guests, ...servants, mary].forEach(p => pose(p, "cheer", 1400));
    run(async stale => {
      // the bridegroom and bride dance, then go back to their seats
      await pause(1500, stale);
      await Promise.all([go(groom, DANCE_SPOTS[8], stale), go(bride, DANCE_SPOTS[9], stale)]);
      spots.dance.set(DANCE_SPOTS[8], groom.id);
      spots.dance.set(DANCE_SPOTS[9], bride.id);
      pose(groom, "dance", 14000);
      pose(bride, "dance", 14000);
      await pause(14000, stale);
      await Promise.all([go(groom, HEAD_SEATS.groom, stale), go(bride, HEAD_SEATS.bride, stale)]);
    });
    // servants pass cups round to the guests
    servants.forEach((s, i) =>
      run(async stale => {
        await pause(2500 + i * 1700, stale);
        while (!stale()) {
          const g = guests[(Math.random() * guests.length) | 0];
          await go(s, jars[(i * 2) % 6].def.pour, stale);
          await pause(400, stale);
          s.variant = "cup";
          await go(s, { x: g.x + (g.x < 180 ? 22 : -22), y: g.y + 4 }, stale);
          s.variant = null;
          pose(g, "cheer", 1400);
          snd.clink();
          say(g, "Thank you!", 2000);
          await pause(5000, stale);
        }
      })
    );
  }

  function enterPhase(name) {
    kit.nextPart();
    phase = name;
    snd.phase(name);
    onPhase(name);
    if (name === "feast") {
      celebrating = false;
      jars.forEach(j => {
        j.assigned = null;
        j.level = 0;
        j.wine = 0;
        j.draw();
      });
      servants.forEach((s, i) => {
        s.variant = null;
        s.stop();
        s.walkTo(find({ x: s.x, y: s.y }, standBy[i]));
        s.setPose("idle");
      });
      [groom, bride, master].forEach((p, i) => {
        const seat = [HEAD_SEATS.groom, HEAD_SEATS.bride, HEAD_SEATS.master][i];
        p.stop();
        p.walkTo(find({ x: p.x, y: p.y }, seat));
        p.setPose("idle");
      });
      guests.forEach(g => machines.get(g.id) && machines.get(g.id).send({ type: "STOP" }));
    } else if (name === "wineRuns") {
      say(mary, lineFor("mary", "wineRuns", 0), 3200);
      wait(3400).then(
        () => !S.dead && phase === "wineRuns" && say(mary, lineFor("mary", "wineRuns", 1), 3200)
      );
      wait(3600).then(
        () =>
          !S.dead && phase === "wineRuns" && servants.forEach(s => (s.face = mary.x > s.x ? 1 : -1))
      );
    } else if (name === "fillJars") {
      startFilling();
    } else if (name === "drawOut") {
      // anything left unfilled is filled, then the water turns to wine
      jars.forEach(j => j.setLevel(1));
      turnToWine();
    } else if (name === "celebrate") {
      jars.forEach(j => {
        j.setLevel(1);
        j.setWine(1);
      });
      startCelebrating();
    }
  }
  director.subscribe(snap => {
    if (snap.value !== phase) {
      enterPhase(snap.value);
    }
  });

  // ---- the first moment: the party takes its places and the guests arrive ----
  const placeAt = (p, pt) => p.place(pt.x, pt.y);
  placeAt(groom, HEAD_SEATS.groom);
  placeAt(bride, HEAD_SEATS.bride);
  placeAt(master, HEAD_SEATS.master);
  placeAt(mary, MARY_SPOT);
  musicians.forEach((m, i) => placeAt(m, MUSICIAN_SPOTS[i]));
  servants.forEach((s, i) => placeAt(s, standBy[i]));
  if (me) {
    placeAt(me, SPAWN);
  }
  guests.forEach((g, i) => {
    placeAt(g, { x: SPAWN.x + ((i % 5) - 2) * 14, y: SPAWN.y + 4 - (i % 2) * 6 });
    startGuest(g, 300 + i * 650);
  });
  // rebuilt part-way through (the hall changed shape), so carry on from where the story was
  S.restoring = true;
  for (let k = 0; k < PHASES.indexOf(startPhase); k++) {
    director.send({ type: "SKIP" });
  }
  S.restoring = false;
  if (sound) {
    sound.phase(phase);
  }
  // the earlier parts were only passed through, so what was said in them is not left hanging in the air
  people.forEach(p => p.clearBubble());
  onPhase(phase);
  if (sound && startPhase === "feast") {
    sound.phase("feast");
  }

  // ---- what you can do ----
  const info = {
    jar: "Stone water pots, for the purifying of the Jews.",
    cistern: "The servants draw water from here.",
    table: "The table of the bridegroom and bride."
  };
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
  const helpFill = jar =>
    toMe(async stale => {
      if (jar.full || (jar.assigned && jar.assigned !== "me")) {
        say(me, "Filled to the brim.", 2200);
        return;
      }
      await fillJar(me, jar, stale);
      if (!stale()) {
        pose(me, "cheer", 1200);
      }
    });
  const offerCup = () =>
    toMe(async stale => {
      const jar = jars[0];
      await go(me, jar.def.pour, stale);
      await pause(400, stale);
      me.variant = "cup";
      const g = guests.slice().sort((a, b) => dist(a, me) - dist(b, me))[0];
      await go(me, { x: g.x + (g.x < 180 ? 22 : -22), y: g.y + 4 }, stale);
      me.variant = null;
      pose(g, "cheer", 1400);
      snd.clink();
      say(g, "Thank you!", 2000);
      pose(me, "wave", 1500);
    });
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
    const jar = jars.find(j => Math.hypot(p.x - j.def.x, p.y - j.def.y) < 20);
    if (jar) {
      if (phase === "fillJars" && !jar.full) {
        return helpFill(jar);
      }
      if (phase === "celebrate") {
        return offerCup();
      }
      return toMe(async stale => {
        await go(me, jar.def.pour, stale);
        say(
          me,
          phase === "feast" || phase === "wineRuns"
            ? info.jar
            : jar.wine > 0.5
            ? "It has become wine."
            : "Filled to the brim.",
          3200
        );
      });
    }
    if (
      p.x > CISTERN.x - 6 &&
      p.x < CISTERN.x + CISTERN.w + 6 &&
      p.y > CISTERN.y - 14 &&
      p.y < CISTERN.y + CISTERN.h + 6
    ) {
      return toMe(async stale => {
        await go(me, CISTERN.use, stale);
        say(me, info.cistern, 2800);
      });
    }
    if (
      p.x > HEAD_TABLE.x &&
      p.x < HEAD_TABLE.x + HEAD_TABLE.w &&
      p.y > HEAD_TABLE.y - 6 &&
      p.y < HEAD_TABLE.y + HEAD_TABLE.h + 6
    ) {
      return toMe(async stale => {
        await go(
          me,
          { x: HEAD_TABLE.x + HEAD_TABLE.w / 2, y: HEAD_TABLE.y + HEAD_TABLE.h + 18 },
          stale
        );
        say(me, info.table, 2800);
      });
    }
    walkMe(p);
  };
  kit.onTap(tap);

  // ---- the music notes over the musicians, and the glow of the lanterns ----
  let notes = 0;
  kit.frame.push((dt, now) => {
    notes += dt;
    if (notes > (celebrating ? 0.55 : 2.4) && !reduced) {
      notes = 0;
      const m = musicians[(Math.random() * musicians.length) | 0];
      if (m) {
        spawnNote(m.x, m.y - FIG.h * 0.6);
      }
    }
    glows.forEach((g, i) => {
      g.alpha = 0.75 + Math.sin(now / 500 + i) * 0.25;
    });
  });

  return {
    phase: () => phase,
    skip: () => director.send({ type: "SKIP" }),
    replay: () => {
      S.meEpoch++;
      director.send({ type: "REPLAY" });
    },
    helpWithJars() {
      if (phase !== "fillJars") {
        onHint(
          phase === "celebrate" || phase === "drawOut"
            ? "The pots are already full."
            : "Wait for the servants to be told to fill the pots."
        );
        return;
      }
      const jar = nearestOpenJar(me || SPAWN);
      if (jar) {
        helpFill(jar);
      }
    },
    greetNearest() {
      if (!me) {
        return;
      }
      const o = people.filter(p => p !== me).sort((a, b) => dist(a, me) - dist(b, me))[0];
      if (o) {
        greetPerson(o);
      }
    },
    dance() {
      if (!me) {
        return;
      }
      if (phase !== "celebrate") {
        onHint("The dancing begins once the good wine is poured.");
        return;
      }
      toMe(async stale => {
        const s = free(spots.dance, DANCE_SPOTS, me);
        await go(me, s, stale);
        pose(me, "dance", 12000);
      });
    },
    offerCup() {
      if (phase !== "celebrate") {
        onHint("There is no wine to share yet.");
        return;
      }
      offerCup();
    },
    destroy() {
      director.stop();
      machines.forEach(m => m.stop());
      kit.destroy();
    }
  };
}
