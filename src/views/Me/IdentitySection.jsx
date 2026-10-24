import { useStore } from "@/store.js";
import { NAMES_M, NAMES_F, PLACES } from "@/lib/data.js";
import { teamIndex, takenAliases } from "@/lib/player.js";
import { Crest } from "@/components/ui/Emblems.jsx";
import { setDraft, setGender, randomName } from "@/actions";

function Tribe({ me, teams }) {
  const myTeam = me ? teamIndex(me, teams) : -1;
  return (
    <div className="field">
      <span className="lbl">Tribe</span>
      {myTeam >= 0 ? (
        <div className="tribe-line">
          <Crest i={myTeam} />
          <div>
            <b>{teams[myTeam]}</b>
            <span className="small muted">
              Assigned when you joined. Ask a leader if you need to move.
            </span>
          </div>
        </div>
      ) : (
        <p className="small muted">
          You'll be placed into one of the four tribes ({teams.join(", ")}) when you join, keeping
          the teams even.
        </p>
      )}
    </div>
  );
}

// Brother or sister, Bible name or your own, hometown, and (read-only) tribe.
export default function IdentitySection({ d, g }) {
  const { me, players, config } = useStore();
  const taken = takenAliases(players, me);
  const names = g === "f" ? NAMES_F : NAMES_M;
  return (
    <div className="group">
      <h3 className="ghead">Identity</h3>
      <div className="field">
        <span className="lbl">I'm a</span>
        <div className="seg" role="group" aria-label="Brother or sister">
          <button onClick={() => setGender("m")} aria-pressed={g === "m"}>
            Brother
          </button>
          <button onClick={() => setGender("f")} aria-pressed={g === "f"}>
            Sister
          </button>
        </div>
      </div>
      <div className="field">
        <span className="lbl">Name</span>
        <div className="seg" role="group" aria-label="Name type">
          <button
            onClick={() => setDraft({ nameMode: "bible" })}
            aria-pressed={d.nameMode !== "own"}
          >
            Bible name
          </button>
          <button onClick={() => setDraft({ nameMode: "own" })} aria-pressed={d.nameMode === "own"}>
            My own name
          </button>
        </div>
        {d.nameMode === "own" ? (
          <>
            <input
              type="text"
              id="own-name"
              maxLength={20}
              autoComplete="given-name"
              placeholder="First name or nickname"
              value={d.ownName || ""}
              onChange={e => setDraft({ ownName: e.target.value })}
              aria-label="Your first name or nickname"
            />
            <p className="small muted">
              First name or nickname only, up to 20 letters. It's shown to everyone in the group.
            </p>
          </>
        ) : (
          <div className="opts">
            {names.map(nm => {
              const t = taken.has((nm + (d.place ? " " + d.place : "")).toLowerCase());
              return (
                <button
                  key={nm}
                  className="opt"
                  onClick={() => setDraft({ name: nm })}
                  aria-pressed={d.name === nm}
                  disabled={t}
                >
                  {nm}
                </button>
              );
            })}
          </div>
        )}
        <div className="row">
          <label htmlFor="place" className="small">
            Hometown (optional)
          </label>
          <select
            id="place"
            value={d.place}
            onChange={e => {
              setDraft({ place: e.target.value });
              e.target.blur();
            }}
          >
            {PLACES.map(p => (
              <option key={p} value={p}>
                {p || "None"}
              </option>
            ))}
          </select>
          {d.nameMode === "own" ? null : (
            <button className="btn sm" onClick={randomName}>
              Random name
            </button>
          )}
        </div>
      </div>
      <Tribe me={me} teams={config.teams} />
    </div>
  );
}
