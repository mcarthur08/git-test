import { useState } from "react";
import { useStore } from "@/store.js";
import { DAYS, PLAN, VICTORIES, CHAPTERS, TEAM_ICONS } from "@/lib/data.js";
import { iso, parseISO, fmtDate, plural, lsGet, lsSet } from "@/lib/util.js";
import { stats, planDay, dayDate, allPlayers, teamIndex } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";

const chRef = c => (c.one ? c.b : `${c.b} ${c.c}`);
const ord = n => ["1st", "2nd", "3rd", "4th"][n - 1];

// Thursday recap: shown once per week from week 2 on, until dismissed.
export default function RecapCard() {
  const { config, me, players } = useStore();
  const [, bump] = useState(0);
  const pd = planDay(config);
  const start = parseISO(config.start);
  if (!start || !pd || pd < 8 || pd > DAYS + 7) {
    return null;
  }
  const w = Math.min(10, Math.floor((pd - 1) / 7)); // weeks finished so far; last week = w
  if (lsGet("nt70.recap") === w) {
    return null;
  }
  const from = iso(dayDate(start, 7 * (w - 1) + 1));
  const to = iso(dayDate(start, 7 * w));
  const inWeek = dt => dt >= from && dt <= to;
  const chaptersIn = (p, test) =>
    Object.entries(p.done).reduce((a, [d, dt]) => a + (test(dt) ? PLAN[d - 1].count : 0), 0);
  const people = allPlayers(players, me);
  const myCh = chaptersIn(me, inWeek);
  const myDays = Object.values(me.done).filter(inWeek).length;
  const groupCh = people.reduce((a, p) => a + chaptersIn(p, inWeek), 0);
  // tribe standing by average chapters read up to a date
  const standing = until =>
    config.teams
      .map((t, i) => {
        const mem = people.filter(p => teamIndex(p, config.teams) === i);
        return {
          i,
          avg: mem.length
            ? mem.reduce((a, p) => a + chaptersIn(p, dt => dt <= until), 0) / mem.length
            : 0
        };
      })
      .sort((a, b) => b.avg - a.avg)
      .map(x => x.i);
  const ti = teamIndex(me, config.teams);
  let tribeLine = null;
  if (ti >= 0 && people.length > 1) {
    const prevEnd = iso(dayDate(start, 7 * (w - 1)));
    const now = standing(to).indexOf(ti) + 1;
    const before = w > 1 ? standing(prevEnd).indexOf(ti) + 1 : now;
    const tn = config.teams[ti];
    tribeLine =
      now < before ? (
        <>
          {tn} moved up to <b>{ord(now)}</b>.
        </>
      ) : now > before ? (
        <>
          {tn} slipped to <b>{ord(now)}</b>. This week can change that.
        </>
      ) : (
        <>
          {tn} is holding <b>{ord(now)}</b> place.
        </>
      );
  }
  const nextFirst = PLAN[Math.min(7 * w, DAYS - 1)];
  const nextLast = PLAN[Math.min(7 * w + 6, DAYS - 1)];
  const vic = VICTORIES[w - 1];
  return (
    <section className="card recap">
      <p className="eyebrow">
        Week {w} recap · {fmtDate(parseISO(from))} – {fmtDate(parseISO(to))}
      </p>
      <h3>
        {myDays
          ? `You read ${plural(myDays, "day")} (${myCh} chapters) last week`
          : "A new week, a fresh start"}
      </h3>
      <ul className="recap-list">
        <li>
          <Icon k="group" /> The group read <b>{groupCh} chapters</b> together.
        </li>
        {tribeLine ? (
          <li>
            <Icon k={TEAM_ICONS[ti]} /> {tribeLine}
          </li>
        ) : null}
        {vic && stats(me).n >= vic.day ? (
          <li>
            <Icon k="victories" /> You unlocked <b>{vic.title}</b>. Talk about it in Victories.
          </li>
        ) : null}
        {w < 10 ? (
          <li>
            <Icon k="book" /> This week: <b>{chRef(CHAPTERS[nextFirst.from])}</b> to{" "}
            <b>{chRef(CHAPTERS[nextLast.to - 1])}</b>.
          </li>
        ) : null}
      </ul>
      <button
        className="btn sm"
        onClick={() => {
          lsSet("nt70.recap", w);
          bump(x => x + 1);
        }}
      >
        Got it
      </button>
    </section>
  );
}
