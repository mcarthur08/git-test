import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getState } from "@/store.js";
import { allPlayers } from "@/lib/player.js";
import { buildCast } from "@/lib/cana/cast.js";
import { LAYOUTS, layoutFor } from "@/lib/cana/layout.js";
import { createSound } from "@/lib/cana/sound.js";
import { lsGet, lsSet } from "@/lib/util.js";
import { PHASES, STORY } from "@/lib/cana/story.js";
import { closeScene } from "@/actions";
import { Icon } from "@/components/ui/Icon.jsx";

// whether the person turned the wedding's sound off, remembered between visits
const SOUND_KEY = "nt70.cana.sound";

const STEP_NAMES = {
  feast: "The wedding feast",
  wineRuns: "The wine runs out",
  fillJars: "Fill the waterpots",
  drawOut: "Draw out and taste",
  celebrate: "The good wine"
};

// The wedding at Cana (John 2:1–11) as a place you can walk around in: guests, servants and the wedding party move
// about on their own, and you can walk, greet people, help fill the six stone pots and share the wine. The scene
// itself (PixiJS) is loaded only when this opens, so the rest of the app stays light. The hall comes in two shapes, tall
// for a phone held upright and wide for a desktop or a phone turned sideways, and is rebuilt (at the same point in the
// story) if the box it is in changes shape.
export default function CanaScene() {
  const host = useRef(null);
  const canvas = useRef(null);
  const ctl = useRef(null);
  const kindRef = useRef(null);
  const sound = useRef(null);
  const phaseRef = useRef("feast");
  const [phase, setPhase] = useState("feast");
  const [hint, setHint] = useState("");
  const [state, setState] = useState("loading"); // loading | ready | failed
  const [muted, setMuted] = useState(false);
  const [hasSound, setHasSound] = useState(true);
  const [build, setBuild] = useState(0); // goes up to ask for the scene to be built again
  const [kind, setKind] = useState(null); // "portrait" or "landscape", once the box has been measured
  const closeBtn = useRef(null);
  const box = useRef(null);

  // The sound lasts as long as the scene is open, through any rebuild of the hall. It starts silent in the browser's
  // eyes until the first tap, which is why every tap and key press in the scene calls unlock.
  useEffect(() => {
    const s = createSound({ muted: lsGet(SOUND_KEY) === "off" });
    sound.current = s;
    setMuted(s.isMuted());
    setHasSound(s.supported);
    return () => {
      s.destroy();
      sound.current = null;
    };
  }, []);

  // which hall fits the box, now and whenever the box changes shape
  useLayoutEffect(() => {
    const k = layoutFor(host.current.clientWidth, host.current.clientHeight).kind;
    kindRef.current = k;
    setKind(k);
  }, []);
  useEffect(() => {
    const el = host.current;
    let timer;
    const watch = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const k = layoutFor(el.clientWidth, el.clientHeight).kind;
        if (k !== kindRef.current) {
          kindRef.current = k;
          setKind(k);
        }
      }, 350);
    });
    watch.observe(el);
    return () => {
      watch.disconnect();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!kind) {
      return undefined;
    }
    let gone = false;
    let started = null;
    setState("loading");
    (async () => {
      try {
        const { startCana } = await import("./engine.js");
        const { me, players } = getState();
        const list = allPlayers(players, me);
        const cast = buildCast({ me: me && list.find(p => p.id === me.id), others: list });
        started = await startCana({
          canvas: canvas.current,
          host: host.current,
          cast,
          layout: LAYOUTS[kind],
          sound: sound.current,
          startPhase: phaseRef.current,
          reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
          hooks: {
            onPhase: p => {
              phaseRef.current = p;
              if (!gone) {
                setPhase(p);
              }
            },
            onLost: () => {
              if (!gone) {
                setBuild(n => n + 1);
              }
            },
            onHint: h => {
              if (!gone) {
                setHint(h);
                setTimeout(() => !gone && setHint(""), 3600);
              }
            }
          }
        });
        if (gone) {
          started.destroy();
          return;
        }
        ctl.current = started;
        setState("ready");
      } catch (err) {
        console.error(err);
        if (!gone) {
          setState("failed");
        }
      }
    })();
    return () => {
      gone = true;
      ctl.current = null;
      if (started) {
        started.destroy();
      }
    };
  }, [kind, build]);

  // Escape closes it, the page behind stops scrolling, and Tab stays inside.
  useEffect(() => {
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = e => {
      if (e.key === "Escape") {
        closeScene();
      } else if (e.key === "Tab" && box.current) {
        const items = [...box.current.querySelectorAll("button:not([disabled])")];
        if (!items.length) {
          return;
        }
        const i = items.indexOf(document.activeElement);
        const next = e.shiftKey
          ? i <= 0
            ? items.length - 1
            : i - 1
          : i === items.length - 1
          ? 0
          : i + 1;
        e.preventDefault();
        items[next].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    lsSet(SOUND_KEY, next ? "off" : "on");
    if (sound.current) {
      sound.current.setMuted(next);
      sound.current.unlock();
    }
  };
  const unlock = () => sound.current && sound.current.unlock();

  const step = PHASES.indexOf(phase) + 1;
  const act = fn => () => ctl.current && fn(ctl.current);
  const ready = state === "ready";
  return (
    <div
      className={"cana " + (kind || "")}
      role="dialog"
      aria-modal="true"
      aria-label="The wedding at Cana"
      ref={box}
      onPointerDown={unlock}
      onKeyDown={unlock}
    >
      <header className="cana-bar">
        <div className="cana-title">
          <b>The wedding at Cana</b>
          <span>John 2:1–11</span>
        </div>
        <div className="cana-tools">
          {hasSound ? (
            <button
              className="cana-close"
              aria-label="Sound"
              aria-pressed={!muted}
              title={muted ? "Turn the sound on" : "Turn the sound off"}
              onClick={toggleSound}
            >
              <Icon k={muted ? "mute" : "sound"} />
            </button>
          ) : null}
          <button
            ref={closeBtn}
            className="cana-close"
            aria-label="Leave the wedding"
            onClick={closeScene}
          >
            <Icon k="collapse" />
          </button>
        </div>
      </header>
      <div className="cana-host" ref={host}>
        <canvas
          key={(kind || "pending") + build}
          ref={canvas}
          aria-label="The courtyard at the wedding. Use the buttons beside or below it to take part."
        />
        {state === "loading" ? <p className="cana-note">Setting the tables…</p> : null}
        {state === "failed" ? (
          <p className="cana-note">
            Your device could not start the scene. You can still read the story beside it.
          </p>
        ) : null}
      </div>
      <div className="cana-side">
        <section className="cana-caption" aria-live="polite">
          <p className="cana-step">
            {step} of {PHASES.length} · {STEP_NAMES[phase]}
          </p>
          {STORY[phase].quotes.map(([ref, text]) => (
            <p className="cana-verse" key={ref}>
              <span>{ref}</span> {text}
            </p>
          ))}
        </section>
        <p className="cana-hint small" role="status">
          {hint || "Tap the floor to walk, a guest to say hello, or a water pot to help."}
        </p>
        <div className="cana-actions" role="group" aria-label="Take part">
          <button className="btn sm" disabled={!ready} onClick={act(c => c.helpWithJars())}>
            Fill a pot
          </button>
          <button className="btn sm" disabled={!ready} onClick={act(c => c.greetNearest())}>
            Say hello
          </button>
          <button className="btn sm" disabled={!ready} onClick={act(c => c.dance())}>
            Dance
          </button>
          <button className="btn sm" disabled={!ready} onClick={act(c => c.offerCup())}>
            Share a cup
          </button>
          <button
            className="btn sm"
            disabled={!ready || phase === "celebrate"}
            onClick={act(c => c.skip())}
          >
            Next part
          </button>
          <button className="btn sm" disabled={!ready} onClick={act(c => c.replay())}>
            Start again
          </button>
        </div>
      </div>
    </div>
  );
}
