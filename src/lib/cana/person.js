// How a guest behaves: they idle for a while, pick something to do and walk there, do it for a while, then idle
// again. Their moods are an XState machine; the scene does the walking and tells the machine when they arrive.
// A goal is { kind, x, y, face, ms }: kind says what they do on arrival (sit, dance, chat, look, wander).
import { setup, assign } from "xstate";

export const personMachine = setup({
  delays: {
    idleFor: ({ context }) => context.idleMs(),
    actFor: ({ context }) => (context.goal ? context.goal.ms : 1000)
  },
  actions: {
    choose: assign(({ context }) => ({ goal: context.pick(context) })),
    take: assign(({ event }) => ({ goal: event.goal })),
    forget: assign({ goal: null })
  },
  guards: {
    hasGoal: ({ context }) => !!context.goal
  }
}).createMachine({
  id: "person",
  initial: "idle",
  context: ({ input }) => ({ goal: null, pick: input.pick, idleMs: input.idleMs }),
  states: {
    idle: {
      entry: "forget",
      after: { idleFor: { target: "choosing" } },
      on: { GOAL: { target: "walking", actions: "take" } }
    },
    // picks something to do, or goes back to idling if there is nothing
    choosing: {
      entry: "choose",
      always: [{ guard: "hasGoal", target: "walking" }, { target: "idle" }]
    },
    walking: {
      on: {
        ARRIVED: "acting",
        BLOCKED: "idle",
        GOAL: { target: "walking", reenter: true, actions: "take" }
      }
    },
    acting: {
      after: { actFor: "idle" },
      on: {
        GOAL: { target: "walking", actions: "take" },
        STOP: "idle"
      }
    }
  }
});
