// The character editor: editing a draft, then joining or saving.
import { getState, setState } from "@/store.js";
import { UNLOCK, NAMES_M, NAMES_F, PLACES } from "@/lib/data.js";
import { lsSet } from "@/lib/util.js";
import { normLook } from "@/lib/avatar.js";
import { stats, teamIndex, takenAliases, draftName, aliasOf, newDraftFor } from "@/lib/player.js";
import { toast, confetti, queueReveal } from "./ui.js";
import { saveMe } from "./saving.js";
import { pickTeam, tribeReveal } from "./tribes.jsx";
import { guideReveal } from "./releases.jsx";

export const setDraft = patch =>
  setState(s => ({
    draft: { ...s.draft, ...(typeof patch === "function" ? patch(s.draft) : patch) }
  }));
export function setLook(key, val) {
  const need = (UNLOCK[key] || [])[val]?.[2] ?? 0;
  const s = getState();
  const n = s.phase === "join" ? 0 : s.me ? stats(s.me).n : 0;
  if (UNLOCK[key] && need > n) {
    toast(`Read ${need} days to unlock this`);
    return;
  }
  setDraft(d => ({ look: { ...d.look, [key]: val } }));
}

export function setGender(g) {
  const s = getState();
  const d = s.draft;
  const look = { ...d.look };
  if (d.gender !== g) {
    const fresh = newDraftFor(g).look;
    ["cover", "mantle", "tunic", "jewel", "beard"]
      .concat(s.phase === "join" ? ["hair", "face", "eyes", "brows"] : [])
      .forEach(k => {
        look[k] = fresh[k];
      });
  }
  look.g = g;
  setDraft({ gender: g, name: "", look });
}

export function randomName() {
  const s = getState();
  const d = s.draft;
  const taken = takenAliases(s.players, s.me);
  const names = d.gender === "f" ? NAMES_F : NAMES_M;
  for (let i = 0; i < 60; i++) {
    const nm = names[Math.floor(Math.random() * names.length)];
    const pl =
      Math.random() < 0.6 ? PLACES[1 + Math.floor(Math.random() * (PLACES.length - 1))] : "";
    if (!taken.has((nm + (pl ? " " + pl : "")).toLowerCase())) {
      setDraft({ name: nm, place: pl });
      break;
    }
  }
}

export function surprise() {
  const d = getState().draft;
  const fresh = newDraftFor(d.gender).look;
  setDraft({ look: { ...fresh, hat: d.look.hat || 0, item: d.look.item || 0 } });
}

export function joinOrSave() {
  const s = getState();
  const d = s.draft;
  const nm = d && draftName(d);
  if (!nm) {
    return;
  }
  const alias = aliasOf(d);
  if (takenAliases(s.players, s.me).has(alias.toLowerCase())) {
    return;
  }
  const base = s.me || { id: s.uid || "local", done: {}, createdAt: new Date().toISOString() };
  const n = stats({ done: base.done || {} }).n;
  const joining = s.phase === "join";
  const ti =
    teamIndex(base, s.config.teams) >= 0 ? teamIndex(base, s.config.teams) : pickTeam(base.id);
  const me = {
    ...base,
    alias,
    gender: d.gender,
    team: String(ti),
    look: normLook({ ...d.look, g: d.gender }, n)
  };
  setState(joining ? { me, phase: "ready", tab: "today", cheering: true } : { me });
  if (joining) {
    setTimeout(() => setState({ cheering: false }), 2000);
    lsSet("nt70.guide", 1);
  }
  saveMe();
  if (joining) {
    confetti(innerWidth / 2, innerHeight / 3, 50);
    queueReveal(tribeReveal(ti, alias));
    queueReveal(guideReveal());
  } else {
    toast("Character saved");
  }
}
