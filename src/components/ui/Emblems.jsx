// Round badges, medals and tribe crests used on cards and reveal screens.
import { TEAM_COLORS, TEAM_ICONS } from "@/lib/data.js";
import { Icon } from "./Icon.jsx";

export function MedalIc({ b }) {
  return (
    <span className="medal-ic" style={{ "--bc": b.color }}>
      <Icon k={b.icon} fill />
    </span>
  );
}

export function VictoryMedal({ i, style }) {
  return (
    <svg className="medal" viewBox="0 0 80 80" aria-hidden="true" style={style}>
      <path d="M28 4 L38 30 L30 32 L20 6 Z" fill="var(--flame)" />
      <path d="M52 4 L42 30 L50 32 L60 6 Z" fill="var(--sky)" />
      <circle cx="40" cy="50" r="26" fill="#E09E00" />
      <circle cx="40" cy="50" r="21" fill="#F5B301" />
      <circle
        cx="40"
        cy="50"
        r="21"
        fill="none"
        stroke="#FFE27A"
        strokeWidth="2"
        strokeDasharray="3 4"
      />
      <path
        d="M24 42 Q40 30 56 42"
        fill="none"
        stroke="#FFF3C4"
        strokeWidth="3"
        strokeLinecap="round"
        opacity=".6"
      />
      <text
        x="40"
        y="58"
        fontSize="22"
        textAnchor="middle"
        fill="#5A3B00"
        fontFamily="Bricolage Grotesque, system-ui, sans-serif"
        fontWeight="800"
      >
        {i + 1}
      </text>
    </svg>
  );
}

export function PinMedal() {
  return (
    <svg className="medal" viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 4C20 4 11 13 11 25c0 16 21 35 21 35s21-19 21-35C53 13 44 4 32 4z"
        fill="var(--flame)"
      />
      <circle cx="32" cy="25" r="9" fill="#fff" />
    </svg>
  );
}

export function Crest({ i, big }) {
  return (
    <span className={"crest" + (big ? " big" : "")} style={{ "--tc": TEAM_COLORS[i] }}>
      <Icon k={TEAM_ICONS[i]} />
    </span>
  );
}
