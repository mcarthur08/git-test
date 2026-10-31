// What people say at the well. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among the people of Sychar.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the people of Sychar, and what you hear when you greet one of them, by part of the story
  town: {
    road: ["The sun is high today.", "A traveller is coming up the road.", ...GREET],
    well: [
      "He looks tired from the road.",
      "A Jew, sitting at Jacob's well?",
      "It is the hottest hour of the day.",
      ...GREET
    ],
    living: [
      "What is he saying to her?",
      "Water that never runs dry?",
      "Jacob dug this well for us.",
      ...GREET
    ],
    tell: [
      "Look, she is running to the town!",
      "What has she seen?",
      "She left her waterpot behind.",
      ...GREET
    ],
    believe: [
      "We have heard him ourselves.",
      "Stay with us a while.",
      "He told her everything she ever did.",
      ...GREET
    ]
  },
  woman: {
    road: ["Time to draw water.", "The jar is heavy in this heat."],
    well: ["A Jew is asking me for a drink?", "There is a stranger at the well."],
    living: [
      "Sir, give me this water, that I thirst not",
      "The well is very deep, sir.",
      "You are a prophet."
    ],
    tell: [
      "Come, see a man, which told me all things that ever I did",
      "Come and see!",
      "Is this not the Christ?"
    ],
    believe: ["I told you!", "Come and hear him."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "town" : role] || LINES.town;
  const set = group[part] || LINES.town.road;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = [
  "Sir, give me this water, that I thirst not",
  "Come, see a man, which told me all things that ever I did",
  "Give me to drink"
];
