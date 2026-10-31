// Who is at the foot of the cliffs: your own character, up to six other players who have reached Caesarea Philippi as
// people of the place, and the four disciples of the story: Peter, Andrew, James and John. Jesus is not shown: he is a
// light that walks among them.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { NPC as FISHERMEN } from "../galilee/cast.js";

export const CAESAREA_DAY = STOPS.find(s => s.place === "Caesarea Philippi").day;
// the stone laid for the church, and the keys of the kingdom (the keepsake of this stop)
export const STONE = UNLOCK.item.findIndex(e => e[1] === "stone");
export const KEYS = UNLOCK.item.findIndex(e => e[1] === "keys");

export const NPC = {
  peter: FISHERMEN.peter,
  andrew: FISHERMEN.andrew,
  james: FISHERMEN.james,
  john: FISHERMEN.john
};

export const MIN_TOWN = 5;
export const MAX_REAL = 6;
export const DISCIPLES = ["peter", "andrew", "james", "john"];

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= CAESAREA_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const town = [...real];
  for (let i = 0; town.length < MIN_TOWN; i++) {
    town.push({
      id: `town-${i}`,
      kind: "guest",
      name: "A traveller",
      look: guestLook(i + 5),
      n: 70,
      real: false
    });
  }
  const npc = id => ({
    id,
    kind: id,
    name: NPC[id].name,
    look: NPC[id].look,
    n: 70,
    real: false,
    speed: 1.2
  });
  return {
    me: me
      ? {
          id: me.id,
          kind: "me",
          name: "You",
          look: me.look,
          n: me.s ? me.s.n : CAESAREA_DAY,
          real: true
        }
      : null,
    town,
    disciples: DISCIPLES.map(npc)
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town, ...c.disciples];
