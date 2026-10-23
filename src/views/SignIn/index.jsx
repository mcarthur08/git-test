import { useStore } from "@/store.js";
import { DAYS, SIGNIN_CAST } from "@/lib/data.js";
import { parseISO, fmtDate, plural } from "@/lib/util.js";
import { planDay, dayDate } from "@/lib/player.js";
import { Icon } from "@/components/ui/Icon.jsx";
import { Avatar } from "@/components/ui/Avatar.jsx";
import SignInCard from "./SignInCard.jsx";

const FEATS = [
  [
    "me",
    "Create your character",
    "First-century robes, veils and mantles. Unlock new gear as you read."
  ],
  [
    "journey",
    "Walk to Jerusalem",
    "Every day you read moves you along Jesus' road to the Passover."
  ],
  ["lion", "Join a tribe", "You're placed in one of four tribes competing on one leaderboard."],
  [
    "victories",
    "Weekly Victory Moments",
    "Stories of God's people overcoming, with a question to talk through."
  ]
];

// "Starts in 3 days" / "Day 12 of 70 is today..." under the headline.
function whenLine(pd) {
  if (pd === null) {
    return "";
  }
  if (pd < 1) {
    return pd === 0 ? "Starts tomorrow" : `Starts in ${plural(1 - pd, "day")}`;
  }
  return pd <= DAYS ? `Day ${pd} of 70 is today. It's not too late to join` : "";
}

// The welcome page people see before they sign in.
export default function SignIn() {
  const config = useStore(s => s.config);
  const st = parseISO(config.start);
  const when = whenLine(planDay(config));
  const dates = st ? `${fmtDate(st)} – ${fmtDate(dayDate(st, DAYS))}` : "70 days";
  return (
    <section className="welcome">
      <div className="w-hero">
        <p className="eyebrow">
          {config.groupName} · {dates}
        </p>
        <h1 className="w-title">
          Seventy days.
          <br />
          One story.
          <br />
          <em>Your quest.</em>
        </h1>
        <p className="w-sub">
          Read the whole New Testament together, about four chapters a day. Build your character,
          join a tribe, and walk the road from Bethlehem to Jerusalem.
        </p>
        {when ? (
          <p className="w-when">
            <Icon k="today" />
            <span>{when}</span>
          </p>
        ) : null}
      </div>
      <div className="cast" aria-hidden="true">
        {SIGNIN_CAST.map((lk, i) => (
          <div key={i} className={"frame" + (i === 2 ? " lead" : "")} style={{ "--i": i }}>
            <Avatar look={lk} n={70} portrait live />
          </div>
        ))}
      </div>
      <SignInCard />
      <ul className="w-feats">
        {FEATS.map(([ic, t, d]) => (
          <li key={t}>
            <span className="w-ic">
              <Icon k={ic} />
            </span>
            <b>{t}</b>
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
