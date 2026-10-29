// One small store for the whole app. Firestore listeners, timers and components all read it with
// getState() / useStore() and change it with setState(), so nothing holds a stale copy.
import { useSyncExternalStore } from "react";
import { DEFAULT_CONFIG } from "./lib/data.js";

let state = {
  phase: "loading", // loading | signin | join | ready
  mode: "local",
  backend: "local",
  db: null,
  uid: null,
  account: null,
  me: null,
  players: {},
  playersLoaded: false,
  config: { ...DEFAULT_CONFIG },
  canLead: false,
  isOwner: false,
  readOnly: false,
  writeError: null,
  cheers: [],
  replies: [],
  messages: [],
  reports: [],
  chatFilter: "all", // all | open (unanswered questions)
  chatSeen: "",
  openDisc: {},
  kjv: {},
  tab: "today",
  sel: null,
  stop: null,
  draft: null,
  fullEditor: false,
  confirmRemove: null,
  tribeOpen: null,
  recoverFor: null,
  openProgress: false,
  cheering: false,
  mapVB: null,
  quiz: null,
  readDay: 1,
  readFrom: "today",
  readJump: null, // { ci, v } to scroll to when the reader opens
  mark: null, // reading bookmark (see actions/bookmark.js)
  rdSize: 2,
  rdLight: false,
  auth: {},
  saveStatus: "",
  toast: null,
  reveals: [],
  teamChecked: false,
  transferChecked: false
};
const listeners = new Set();

export const getState = () => state;
export function setState(patch) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach(l => l());
}

const subscribe = l => {
  listeners.add(l);
  return () => listeners.delete(l);
};
// Selectors must return values that are stable between changes (primitives or state fields).
export const useStore = (select = s => s) => useSyncExternalStore(subscribe, () => select(state));
