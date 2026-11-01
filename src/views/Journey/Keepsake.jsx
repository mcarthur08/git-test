import { useStore } from "@/store.js";
import { UNLOCK } from "@/lib/data.js";
import { Avatar } from "@/components/ui/Avatar.jsx";
import { Icon } from "@/components/ui/Icon.jsx";
import { wearItem } from "@/actions";

// The keepsake each stop gives you when you arrive: an item you can wear, shown on your own character.
export default function Keepsake({ stop, n }) {
  const me = useStore(s => s.me);
  const readOnly = useStore(s => s.readOnly);
  const idx = UNLOCK.item.findIndex(e => e[1] === stop.keepsake);
  if (idx < 0 || !me) {
    return null;
  }
  const got = n >= stop.day;
  const wearing = me.look.item === idx;
  return (
    <div className={"keepsake" + (got ? "" : " locked")}>
      <span className="fprev rprev ks-art">
        {got ? <Avatar look={{ ...me.look, item: idx }} n={n} full /> : <Icon k="lock" />}
      </span>
      <div className="ks-text">
        <p className="eyebrow">Keepsake</p>
        <b>{UNLOCK.item[idx][0]}</b>
        <span className="small muted">
          {got ? "Yours since you reached this stop." : `Arrive on day ${stop.day} to collect it.`}
        </span>
      </div>
      {got ? (
        <button
          className="btn sm"
          disabled={readOnly || wearing}
          aria-pressed={wearing}
          onClick={() => wearItem(idx)}
        >
          {wearing ? "Wearing it" : "Wear it"}
        </button>
      ) : null}
    </div>
  );
}
