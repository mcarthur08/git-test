// The appearance groups of the character editor: face, hair, clothing and gear.
import {
  SKINS,
  HAIRS,
  HAIRC,
  FACES,
  EYES,
  EYEC,
  BROWS,
  MOUTHS,
  BEARDS,
  COVERS,
  MANTLES,
  JEWELS
} from "@/lib/data.js";
import { ROLES, applyRole, wearsRole } from "@/lib/roles.js";
import { Avatar } from "@/components/ui/Avatar.jsx";
import { setRole } from "@/actions";
import { plural } from "@/lib/util.js";
import { Swatches, Unlockables, FeaturePicker } from "./controls.jsx";

// One-tap outfits. Each button shows the role on the current character.
export function RoleSection({ d, g, n }) {
  const look = { ...d.look, g };
  return (
    <div className="group">
      <h3 className="ghead">Choose a role</h3>
      <div className="roles">
        {ROLES.map(role => (
          <button
            key={role.id}
            className="role"
            onClick={() => setRole(role)}
            aria-pressed={wearsRole(look, role, n)}
            title={role.blurb}
          >
            <span className="rprev">
              <Avatar look={applyRole(look, role, n).look} n={n} full />
            </span>
            <span>{role.name}</span>
          </button>
        ))}
      </div>
      <p className="small muted">
        A role picks the clothes and item. Face and hair stay yours, and you can change any piece
        after.
      </p>
    </div>
  );
}

export function FaceSection({ d, g, n }) {
  return (
    <div className="group">
      <h3 className="ghead">Face</h3>
      <div className="two">
        <div className="field">
          <span className="lbl">Skin</span>
          <div className="opts">
            <Swatches k="skin" arr={SKINS} label="Skin tone" d={d} />
          </div>
        </div>
        <div className="field">
          <span className="lbl">Eye color</span>
          <div className="opts">
            <Swatches k="eyeColor" arr={EYEC} label="Eye color" d={d} />
          </div>
        </div>
      </div>
      <FeaturePicker k="face" list={FACES} title="Face shape" vb="50 34 100 112" d={d} n={n} />
      <FeaturePicker k="eyes" list={EYES} title="Eyes" vb="66 76 68 30" d={d} n={n} />
      <FeaturePicker k="brows" list={BROWS} title="Eyebrows" vb="66 70 68 28" d={d} n={n} />
      <FeaturePicker k="mouth" list={MOUTHS} title="Mouth" vb="80 104 40 26" d={d} n={n} />
      {g === "m" ? (
        <FeaturePicker k="beard" list={BEARDS} title="Beard" vb="54 74 92 92" d={d} n={n} />
      ) : null}
    </div>
  );
}

export function HairSection({ d, g, n }) {
  return (
    <div className="group">
      <h3 className="ghead">Hair &amp; head covering</h3>
      <div className="field">
        <span className="lbl">Hair color</span>
        <div className="opts">
          <Swatches k="hairColor" arr={HAIRC} label="Hair color" d={d} />
        </div>
      </div>
      <FeaturePicker
        k="hair"
        list={HAIRS}
        title="Hair"
        vb="40 24 120 130"
        d={d}
        n={n}
        look={{ ...d.look, cover: 0 }}
      />
      <FeaturePicker
        k="cover"
        list={COVERS[g]}
        title={g === "f" ? "Veil or head covering" : "Head covering"}
        vb="40 14 120 140"
        d={d}
        n={n}
      />
    </div>
  );
}

export function ClothingSection({ d, g, n }) {
  return (
    <div className="group">
      <h3 className="ghead">Clothing</h3>
      <div className="field">
        <span className="lbl">{g === "f" ? "Shawl and veil" : "Mantle (outer cloak)"}</span>
        <div className="opts">
          <Swatches k="mantle" arr={MANTLES[g]} d={d} />
        </div>
        <p className="small muted">
          {g === "f"
            ? "Women's garments were often dyed with indigo, madder root and saffron, with embroidered edges."
            : "Men usually wore undyed or earth-toned wool, often with woven stripes."}
        </p>
      </div>
      <div className="two">
        <div className="field">
          <span className="lbl">Robe</span>
          <div className="opts">
            <Unlockables k="tunic" g={g} d={d} n={n} />
          </div>
        </div>
        <div className="field">
          <span className="lbl">Girdle (belt)</span>
          <div className="opts">
            <Unlockables k="sash" g={g} d={d} n={n} />
          </div>
        </div>
      </div>
      {g === "f" ? (
        <FeaturePicker k="jewel" list={JEWELS} title="Jewelry" vb="56 70 88 100" d={d} n={n} />
      ) : null}
    </div>
  );
}

export function GearSection({ d, g, n }) {
  return (
    <div className="group">
      <h3 className="ghead">Gear</h3>
      <div className="field">
        <span className="lbl">Headgear</span>
        <div className="opts">
          <Unlockables k="hat" g={g} d={d} n={n} />
        </div>
      </div>
      <div className="field">
        <span className="lbl">Item</span>
        <div className="opts">
          <Unlockables k="item" g={g} d={d} n={n} />
        </div>
        <p className="small muted">
          Locked gear shows how many days of reading it takes. You have {plural(n, "day")}.
        </p>
      </div>
    </div>
  );
}
