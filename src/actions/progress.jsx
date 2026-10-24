// Marking days read and celebrating everything that unlocks.
import { getState, setState } from "@/store.js";
import { PLAN, STOPS, VICTORIES, UNLOCK, UNLOCK_NAMES } from "@/lib/data.js";
import { todayISO, plural } from "@/lib/util.js";
import { normLook } from "@/lib/avatar.js";
import { stats, BADGES } from "@/lib/player.js";
import { MedalIc, VictoryMedal, PinMedal } from "@/components/ui/Emblems.jsx";
import { Frame } from "@/components/ui/Avatar.jsx";
import { toast, confetti, queueReveal } from "./ui.js";
import { setTab } from "./navigation.js";
import { saveMe } from "./saving.js";

export function toggleDay(day, el) {
  const s = getState();
  if (s.readOnly || !s.me) {
    return;
  }
  const done = { ...s.me.done };
  if (done[day]) {
    const prev = done[day];
    delete done[day];
    applyDone(done, el);
    toast(`Day ${day} marked as not read`, {
      label: "Undo",
      fn: () => {
        applyDone({ ...getState().me.done, [day]: prev }, null, "", { quiet: true });
        toast(`Day ${day} restored`);
      }
    });
    return;
  }
  done[day] = todayISO();
  applyDone(done, el, `Day ${day} done · +${PLAN[day - 1].count} chapters`);
}

export function markThrough(last) {
  const s = getState();
  if (s.readOnly || !s.me) {
    return;
  }
  const done = { ...s.me.done };
  const t = todayISO();
  let added = 0;
  for (let d = 1; d <= last; d++) {
    if (!done[d]) {
      done[d] = t;
      added++;
    }
  }
  if (!added) {
    toast(`Already read through Day ${last}`);
    return;
  }
  applyDone(done, null, `Marked ${plural(added, "day")} as read`);
}

// Save new reading and celebrate everything it unlocked in a single card.
export function applyDone(done, el, msg, opts = {}) {
  const before = stats(getState().me);
  const me = { ...getState().me, done };
  setState({ me });
  const after = stats(me);
  if (after.n > before.n && !opts.quiet) {
    setState({ cheering: true });
    setTimeout(() => setState({ cheering: false }), 2000);
    if (msg) {
      toast(msg);
    }
    if (el) {
      const r = el.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2);
    }
    const crossed = d => d > before.n && d <= after.n;
    const rewards = [];
    VICTORIES.forEach((v, i) => {
      if (crossed(v.day)) {
        rewards.push({
          kicker: "Victory Moment unlocked",
          title: v.title,
          text: `${v.ref} is ready for you. A story of God bringing his people through.`,
          art: <VictoryMedal i={i} />,
          action: "Read the story",
          onAct: () => setTab("victories"),
          ic: "victories"
        });
      }
    });
    STOPS.forEach((t, i) => {
      if (t.day > 0 && crossed(t.day)) {
        rewards.push({
          kicker:
            i === STOPS.length - 1 ? "You made it to the Passover" : "New stop on your journey",
          title: t.place,
          text: t.title + ". " + t.verseRef + ".",
          art: <PinMedal />,
          action: "Open the map",
          onAct: () => {
            setState({ stop: i });
            setTab("journey");
          },
          ic: "journey"
        });
      }
    });
    BADGES.filter(b => b.test(after) && !b.test(before)).forEach(b =>
      rewards.push({
        kicker: "Badge earned",
        title: b.name,
        text: b.desc + ".",
        art: <MedalIc b={b} />,
        ic: "star"
      })
    );
    const g = normLook(me.look, 0).g;
    for (const [k, arr] of Object.entries(UNLOCK)) {
      arr.forEach(([label, , need, who], i) => {
        if (crossed(need) && (!who || who === g)) {
          const look = { ...normLook(me.look, after.n), [k]: i };
          rewards.push({
            kicker: `New ${UNLOCK_NAMES[k]} unlocked`,
            title: label,
            text: `You read ${plural(after.n, "day")}. Try it on!`,
            art: <Frame look={look} n={after.n} className="mid" />,
            action: "Wear it",
            onAct: () => {
              setState(st => ({ me: { ...st.me, look } }));
              saveMe();
              toast(`Wearing ${label}`);
            },
            ic: "me"
          });
        }
      });
    }
    if (rewards.length === 1) {
      queueReveal(rewards[0]);
    } else if (rewards.length > 1) {
      const top = rewards[0];
      queueReveal({
        kicker: `Day ${after.n} of 70`,
        title: `You unlocked ${rewards.length} things`,
        text: "",
        art: top.art,
        action: top.action,
        onAct: top.onAct,
        list: rewards.map(r => ({ ic: r.ic, title: r.title, sub: r.kicker }))
      });
    }
  }
  saveMe();
}
