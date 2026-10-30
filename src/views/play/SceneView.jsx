import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { getState } from "@/store.js";
import { allPlayers } from "@/lib/player.js";
import { createSound } from "@/lib/cana/sound.js";
import { SCENES } from "@/lib/play/registry.js";
import { lsGet, lsSet } from "@/lib/util.js";
import { closeScene } from "@/actions";
import { Icon } from "@/components/ui/Icon.jsx";
import { LOADERS } from "./loaders.js";

// whether the person turned the sound off, remembered between visits (and between scenes). It used to be kept just for
// the wedding at Cana, so that choice is carried over.
const SOUND_KEY = "nt70.play.sound";
const OLD_SOUND_KEY = "nt70.cana.sound";

// A walk-around scene (see lib/play/registry.js) as a full-screen place: the people move about on their own, and you can
// walk, greet people and join in with what the story is doing. The scene itself (PixiJS and its engine) is loaded only
// when this opens, so the rest of the app stays light. The place comes in two shapes, tall for a phone held upright and
// wide for a desktop or a phone turned sideways, and is rebuilt (at the same point in the story) if the box it is in
// changes shape.
export default function SceneView({ scene }) {
  const def = SCENES[scene];
  const host = useRef(null);
  const canvas = useRef(null);
  const ctl = useRef(null);
  const kindRef = useRef(null);
  const sound = useRef(null);
  const phaseRef = useRef(def.parts[0]);
  const [phase, setPhase] = useState(def.parts[0]);
  const [hint, setHint] = useState("");
  const [status, setStatus] = useState("");
  const [state, setState] = useState("loading"); // loading | ready | failed
  const [muted, setMuted] = useState(false);
  const [hasSound, setHasSound] = useState(true);
  const [mod, setMod] = useState(null); // the scene's own code, once it has loaded
  const [build, setBuild] = useState(0); // goes up to ask for the scene to be built again
  const [kind, setKind] = useState(null); // "portrait" or "landscape", once the box has been measured
  const closeBtn = useRef(null);
  const box = useRef(null);

  // Load the scene's code, and start its sound. The sound lasts as long as the scene is open, through any rebuild of the
  // place. It starts silent in the browser's eyes until the first tap, which is why every tap and key press calls unlock.
  useEffect(() => {
    let gone = false;
    let s = null;
    LOADERS[scene]()
      .then(m => {
        if (gone) {
          return;
        }
        const saved = lsGet(SOUND_KEY) ?? lsGet(OLD_SOUND_KEY);
        s = createSound({ muted: saved === "off", ...m.soundConfig });
        sound.current = s;
        setMuted(s.isMuted());
        setHasSound(s.supported);
        setMod(m);
      })
      .catch(err => {
        console.error(err);
        if (!gone) {
          setState("failed");
        }
      });
    return () => {
      gone = true;
      if (s) {
        s.destroy();
      }
      sound.current = null;
    };
  }, [scene]);

  // which place fits the box, now and whenever the box changes shape
  useLayoutEffect(() => {
    if (!mod) {
      return;
    }
    const k = mod.layoutFor(host.current.clientWidth, host.current.clientHeight).kind;
    kindRef.current = k;
    setKind(k);
  }, [mod]);
  useEffect(() => {
    if (!mod) {
      return undefined;
    }
    const el = host.current;
    let timer;
    const watch = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const k = mod.layoutFor(el.clientWidth, el.clientHeight).kind;
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
  }, [mod]);

  useEffect(() => {
    if (!mod || !kind) {
      return undefined;
    }
    let gone = false;
    let started = null;
    setState("loading");
    (async () => {
      try {
        const { me, players } = getState();
        const list = allPlayers(players, me);
        const cast = mod.buildCast({ me: me && list.find(p => p.id === me.id), others: list });
        started = await mod.start({
          canvas: canvas.current,
          host: host.current,
          cast,
          layout: mod.LAYOUTS[kind],
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
            onStatus: t => {
              if (!gone) {
                setStatus(t);
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
  }, [mod, kind, build]);

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

  const step = def.parts.indexOf(phase) + 1;
  const act = fn => () => ctl.current && fn(ctl.current);
  const ready = state === "ready";
  const last = def.parts[def.parts.length - 1];
  return (
    <div
      className={"play " + (kind || "")}
      role="dialog"
      aria-modal="true"
      aria-label={def.title}
      ref={box}
      onPointerDown={unlock}
      onKeyDown={unlock}
    >
      <header className="play-bar">
        <div className="play-title">
          <b>{def.title}</b>
          <span>{def.ref}</span>
        </div>
        <div className="play-tools">
          {hasSound ? (
            <button
              className="play-close"
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
            className="play-close"
            aria-label="Leave the scene"
            onClick={closeScene}
          >
            <Icon k="collapse" />
          </button>
        </div>
      </header>
      <div className="play-host" ref={host}>
        <canvas
          key={(kind || "pending") + build}
          ref={canvas}
          aria-label={`${def.title}. Use the buttons beside or below it to take part.`}
        />
        {state === "loading" ? <p className="play-note">Setting the scene…</p> : null}
        {state === "failed" ? (
          <p className="play-note">
            Your device could not start the scene. You can still read the story beside it.
          </p>
        ) : null}
      </div>
      <div className="play-side">
        <section className="play-caption" aria-live="polite">
          <p className="play-step">
            {step} of {def.parts.length} · {def.steps[phase]}
          </p>
          {def.story[phase].quotes.map(([ref, text]) => (
            <p className="play-verse" key={ref}>
              <span>{ref}</span> {text}
            </p>
          ))}
          {status ? <p className="play-status">{status}</p> : null}
        </section>
        <p className="play-hint small" role="status">
          {hint || def.hint}
        </p>
        <div className="play-actions" role="group" aria-label="Take part">
          {def.actions.map(a => (
            <button
              key={a.run}
              className="btn sm"
              disabled={!ready}
              onClick={act(c => c[a.run] && c[a.run]())}
            >
              {a.label}
            </button>
          ))}
          <button
            className="btn sm"
            disabled={!ready || phase === last}
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
