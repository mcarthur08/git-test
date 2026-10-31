// The story of the wedding at Cana (John 2:1–11) as a director: five phases that run one after another, and the
// words from Scripture shown in each. The director is an XState machine, so it can be run and tested without a
// screen. Jesus is never drawn: the story is told in the words of the passage.
import { setup } from "xstate";

export const PHASES = ["feast", "wineRuns", "fillJars", "drawOut", "celebrate"];

// KJV text, checked against the Bible text the app ships (see phaseText). `ms` is how long a phase lasts if nothing
// speeds it up.
export const STORY = {
  feast: {
    ms: 9000,
    ref: "John 2:1–2",
    quotes: [
      [
        "John 2:1",
        "And the third day there was a marriage in Cana of Galilee; and the mother of Jesus was there:"
      ],
      ["John 2:2", "And both Jesus was called, and his disciples, to the marriage."]
    ]
  },
  wineRuns: {
    ms: 7000,
    ref: "John 2:3, 5",
    quotes: [
      [
        "John 2:3",
        "And when they wanted wine, the mother of Jesus saith unto him, They have no wine."
      ],
      ["John 2:5", "His mother saith unto the servants, Whatsoever he saith unto you, do it."]
    ]
  },
  fillJars: {
    ms: 48000,
    ref: "John 2:6–7",
    quotes: [
      ["John 2:6", "And there were set there six waterpots of stone"],
      [
        "John 2:7",
        "Jesus saith unto them, Fill the waterpots with water. And they filled them up to the brim."
      ]
    ]
  },
  drawOut: {
    ms: 22000,
    ref: "John 2:8–9",
    quotes: [
      [
        "John 2:8",
        "And he saith unto them, Draw out now, and bear unto the governor of the feast. And they bare it."
      ]
    ]
  },
  celebrate: {
    ms: 0,
    ref: "John 2:10–11",
    quotes: [
      ["John 2:10", "but thou hast kept the good wine until now."],
      [
        "John 2:11",
        "This beginning of miracles did Jesus in Cana of Galilee, and manifested forth his glory; and his disciples believed on him."
      ]
    ]
  }
};

// feast → wineRuns → fillJars → drawOut → celebrate. Each phase moves on by itself after its time; the scene can hurry
// it along (ALL_FILLED once every pot is full, TASTED once the master has drunk) or send it round again (REPLAY).
export const directorMachine = setup({
  delays: {
    feast: () => STORY.feast.ms,
    wineRuns: () => STORY.wineRuns.ms,
    fillJars: () => STORY.fillJars.ms,
    drawOut: () => STORY.drawOut.ms
  }
}).createMachine({
  id: "cana",
  initial: "feast",
  states: {
    feast: { after: { feast: "wineRuns" }, on: { SKIP: "wineRuns" } },
    wineRuns: { after: { wineRuns: "fillJars" }, on: { SKIP: "fillJars" } },
    fillJars: { after: { fillJars: "drawOut" }, on: { ALL_FILLED: "drawOut", SKIP: "drawOut" } },
    drawOut: { after: { drawOut: "celebrate" }, on: { TASTED: "celebrate", SKIP: "celebrate" } },
    celebrate: {}
  },
  on: { REPLAY: ".feast" }
});

// The words shown for a phase, straight from its verses.
export const phaseText = phase => STORY[phase].quotes.map(q => q[1]).join(" ");
