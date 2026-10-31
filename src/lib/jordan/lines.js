// What people say at the river. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among people who have come out to the Jordan.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the people who have come to the river, and what you hear when you greet one of them, by part of the story
  town: {
    come: [
      "The water is cold today.",
      "Have you been baptized yet?",
      "So many have come.",
      ...GREET
    ],
    forbid: [
      "Who is the man John is speaking to?",
      "John will not let him in the water?",
      "Listen, they are talking.",
      ...GREET
    ],
    baptized: ["He is going down into the water.", "Look, he is coming up!", ...GREET],
    opened: ["Look up! The sky!", "What is that, coming down?", "A dove!", ...GREET],
    voice: ["Did you hear that?", "A voice from heaven.", "I will never forget this day.", ...GREET]
  },
  baptist: {
    come: ["Come into the river.", "Step down into the water, friend."],
    forbid: [
      "I have need to be baptized of thee, and comest thou to me?",
      "Suffer it to be so now"
    ],
    baptized: ["Down into the water."],
    opened: ["Look up!"],
    voice: ["I saw it with my own eyes."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "town" : role] || LINES.town;
  const set = group[part] || LINES.town.come;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passage itself, which the tests check against the KJV text.
export const SCRIPTURE_LINES = [
  "I have need to be baptized of thee, and comest thou to me",
  "Suffer it to be so now"
];
