// What people say in the courtyard. Anything that quotes Scripture is word for word from the KJV (and tested
// against it); the rest is ordinary talk at a wedding.
const GREET = [
  "Peace be with you!",
  "Shalom!",
  "Grace to you.",
  "What a joyful day!",
  "Good to see you."
];

export const LINES = {
  // said when you greet someone (or they greet you), by phase
  greet: {
    feast: ["Blessings on the bride and groom!", "Come, sit and eat.", ...GREET],
    wineRuns: [
      "The wine is almost gone…",
      "Have you tasted the wine? There is none left.",
      ...GREET
    ],
    fillJars: ["What are the servants doing?", "Six stone pots, filled with water?", ...GREET],
    drawOut: ["Something is happening…", "Look, they are drawing from the pots.", ...GREET],
    celebrate: [
      "Never has wine tasted so good!",
      "Come and dance!",
      "Blessed be this day.",
      ...GREET
    ]
  },
  // what the people of the story say when you speak to them
  mary: {
    feast: ["I am glad to see you at the wedding."],
    wineRuns: ["They have no wine.", "Whatsoever he saith unto you, do it."],
    fillJars: ["Whatsoever he saith unto you, do it."],
    drawOut: ["Whatsoever he saith unto you, do it."],
    celebrate: ["Whatsoever he saith unto you, do it."]
  },
  master: {
    feast: ["A fine feast, is it not?"],
    wineRuns: ["Is there no wine left?"],
    fillJars: ["What is this I hear about water?"],
    drawOut: ["Bring me some of what you have drawn."],
    celebrate: ["…thou hast kept the good wine until now."]
  },
  groom: {
    feast: ["Welcome to my wedding!"],
    wineRuns: ["I do not know what to do."],
    fillJars: ["Why are they filling the water pots?"],
    drawOut: ["Something wonderful has happened."],
    celebrate: ["Thank you for coming. Blessed be this day."]
  },
  bride: {
    feast: ["We are so glad you came."],
    wineRuns: ["I hope the guests do not notice."],
    fillJars: ["What is happening at the water pots?"],
    drawOut: ["Do you smell that?"],
    celebrate: ["What a wonderful wedding!"]
  },
  servant: {
    feast: ["Welcome. Mind the water pots."],
    wineRuns: ["We have no more wine."],
    fillJars: ["Up to the brim."],
    drawOut: ["We drew it out ourselves."],
    celebrate: ["We drew the water. We knew where it came from."]
  },
  musician: {
    feast: ["A song for the wedding!"],
    wineRuns: ["We will play on."],
    fillJars: ["We will play on."],
    drawOut: ["Listen!"],
    celebrate: ["Dance, everyone!"]
  }
};

// A line for a role in a phase; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, phase, seed = 0) {
  const set =
    (role === "guest" ? LINES.greet : LINES[role] || LINES.greet)[phase] || LINES.greet.feast;
  return set[Math.abs(seed) % set.length];
}

// The words spoken in the passage itself, word for word, which are checked against the KJV text.
export const SCRIPTURE_LINES = [
  "They have no wine.",
  "Whatsoever he saith unto you, do it.",
  "thou hast kept the good wine until now."
];
