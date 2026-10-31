// Who is in the upper room: your own character, up to four other players who have reached Jerusalem as fellow disciples,
// and the people of the story: Peter, John, Andrew and James, and the goodman of the house, who shows the room. Jesus is not
// shown: he is a light that comes in and stays at the head of the table.
import { STOPS, UNLOCK } from "../data.js";
import { hash, guestLook } from "../cana/cast.js";
import { NPC as DISCIPLES } from "../galilee/cast.js";

export const JERUSALEM_DAY = STOPS.find(s => s.place === "Jerusalem").day;
// the cup and the bread (the loaves) that are passed round the table, and the pitcher the goodman carries in
const itemIndex = name => UNLOCK.item.findIndex(e => e[1] === name);
export const CUP = itemIndex("cup");
export const LOAVES = itemIndex("loaves");
export const JAR = itemIndex("jar");

export const NPC = {
  peter: DISCIPLES.peter,
  andrew: DISCIPLES.andrew,
  james: DISCIPLES.james,
  john: DISCIPLES.john,
  // "a man bearing a pitcher of water" (Luke 22:10), who owns the house
  goodman: {
    name: "The goodman",
    look: {
      g: "m",
      skin: 1,
      hair: 2,
      hairColor: 3,
      beard: 2,
      tunic: 2,
      sash: 1,
      mantle: 0,
      cover: 1,
      hem: 1,
      face: 2
    }
  }
};

// there is a place at the table for each of the four disciples and for four more
export const MAX_REAL = 4;
export const MIN_TOWN = 4;
// John and Peter sit nearest him, then Andrew and James
export const DISCIPLE_IDS = ["john", "peter", "andrew", "james"];

// everyone in the scene. `others` are the other players, with their stats `s`.
export function buildCast({ me, others }) {
  const real = others
    .filter(p => p.s.n >= JERUSALEM_DAY && (!me || p.id !== me.id))
    .sort((a, b) => hash(a.id) - hash(b.id))
    .slice(0, MAX_REAL)
    .map(p => ({ id: p.id, kind: "guest", name: p.alias, look: p.look, n: p.s.n, real: true }));
  const town = [...real];
  for (let i = 0; town.length < MIN_TOWN; i++) {
    town.push({
      id: `town-${i}`,
      kind: "guest",
      name: "A disciple",
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
          n: me.s ? me.s.n : JERUSALEM_DAY,
          real: true
        }
      : null,
    town,
    disciples: DISCIPLE_IDS.map(npc),
    goodman: npc("goodman")
  };
}

export const everyone = c => [...(c.me ? [c.me] : []), ...c.town, ...c.disciples, c.goodman];
