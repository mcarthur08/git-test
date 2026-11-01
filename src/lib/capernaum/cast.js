// Who is on the shore: your own character, up to six other players who have reached Capernaum as people of the town, and
// the people of the story: Peter and Andrew, James and John, and their father Zebedee. Jesus is not shown: he is a light
// that walks along the shore.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { NPC as FISHERMEN } from "../galilee/cast.js";

export const CAPERNAUM_DAY = STOPS.find(s => s.scene === "capernaum").day;
// the fishing net, and the catch of fish (the keepsake of this stop)
export const NET = UNLOCK.item.findIndex(e => e[1] === "net");
export const FISH = UNLOCK.item.findIndex(e => e[1] === "fish");

export const NPC = {
  peter: FISHERMEN.peter,
  andrew: FISHERMEN.andrew,
  james: FISHERMEN.james,
  john: FISHERMEN.john,
  // their father: older, with a grey beard
  zebedee: {
    name: "Zebedee",
    look: {
      g: "m",
      skin: 3,
      hair: 0,
      hairColor: 5,
      beard: 4,
      tunic: 4,
      sash: 0,
      mantle: 1,
      cover: 1,
      hem: 1,
      face: 3
    }
  }
};

export const MIN_TOWN = 5;
export const MAX_REAL = 6;
export const FOLLOWERS = ["peter", "andrew", "james", "john"];

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= CAPERNAUM_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const town = [...real];
  for (let i = 0; town.length < MIN_TOWN; i++) {
    town.push({
      id: `town-${i}`,
      kind: "guest",
      name: "A neighbour",
      look: guestLook(i + 3),
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
          n: me.s ? me.s.n : CAPERNAUM_DAY,
          real: true
        }
      : null,
    town,
    fishers: FOLLOWERS.map(npc),
    zebedee: npc("zebedee")
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town, ...c.fishers, c.zebedee];
