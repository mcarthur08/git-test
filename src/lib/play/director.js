// The director of a scene's story, made from a list of parts: each part runs by itself for its time, then the next
// begins. A part can also be hurried along by an event the scene sends (such as the pots all being full), and SKIP and
// REPLAY work from anywhere. It is an XState machine, so it can be run and tested without a screen.
import { setup } from "xstate";

// parts: [{ id, ms, on?: { EVENT: "partId" } }] in order. The last part has no time: it just stays.
export function makeDirector(parts) {
  const states = {};
  parts.forEach((p, i) => {
    const next = parts[i + 1] ? parts[i + 1].id : null;
    states[p.id] = {
      ...(next ? { after: { [p.id]: next } } : {}),
      on: { ...(next ? { SKIP: next } : {}), ...(p.on || {}) }
    };
  });
  const delays = {};
  parts.slice(0, -1).forEach(p => {
    delays[p.id] = () => p.ms;
  });
  return setup({ delays }).createMachine({
    id: "scene",
    initial: parts[0].id,
    states,
    on: { REPLAY: `.${parts[0].id}` }
  });
}
