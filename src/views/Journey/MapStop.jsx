// One town on the map: a dot, an optional pulse for the next stop, and its name. Clickable on the big map only.
export default function MapStop({ stop: s, reached, next, last, selected, onSelect }) {
  const r = last ? 9 : 6;
  const interactive = !onSelect
    ? {}
    : {
        tabIndex: 0,
        role: "button",
        "aria-label": `${s.place}: ${s.title}${reached ? ", reached" : `, at day ${s.day}`}`,
        onClick: onSelect,
        onKeyDown: e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(true);
          }
        }
      };
  return (
    <g
      className={
        "m-stop" + (reached ? " reached" : "") + (next ? " next" : "") + (selected ? " sel" : "")
      }
      {...interactive}
    >
      {next ? <circle cx={s.x} cy={s.y} r={r + 4} className="m-pulse" /> : null}
      <circle cx={s.x} cy={s.y} r={r + 7} fill="transparent" />
      <circle cx={s.x} cy={s.y} r={r} className="m-dot" />
      {last ? (
        <>
          <path
            d={`M${s.x - 4} ${s.y + 1} l3 3 l5 -6`}
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={reached ? 1 : 0}
          />
          <path
            d={`M${s.x - 5} ${s.y - 14} h10 v-3 l-2.5 2 l-2.5 -4 l-2.5 4 l-2.5 -2 z`}
            fill="var(--gold)"
          />
        </>
      ) : null}
      {s.la === "none" ? null : (
        <text
          x={s.x + s.lx}
          y={s.y + s.ly}
          textAnchor={s.la}
          className={"m-town" + (last ? " big" : "")}
        >
          {s.place}
        </text>
      )}
    </g>
  );
}
