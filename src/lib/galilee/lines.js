// What people say in the boat. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among tired fishermen.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // other players, and what you hear when you greet one of them, by part of the story
  crew: {
    evening: ["A quiet evening on the water.", "Row steady.", ...GREET],
    storm: ["Hold on!", "The waves are huge!", "Bail, bail!", ...GREET],
    fear: ["We are filling up!", "Quick, the water!", "Where is the shore?", ...GREET],
    calm: ["Do you hear that? Nothing.", "The sea is flat as glass.", ...GREET],
    marvel: ["Who is he?", "Even the wind obeys him.", "I have never seen the like.", ...GREET]
  },
  // the people of the story
  peter: {
    evening: ["Pull for the other side."],
    storm: ["I have fished here all my life, and never seen this."],
    fear: ["Master, carest thou not that we perish?"],
    calm: ["The wind has stopped."],
    marvel: ["What manner of man is this?"]
  },
  andrew: {
    evening: ["The other boats are following."],
    storm: ["Bail faster!"],
    fear: ["Wake him!"],
    calm: ["There is a great calm."],
    marvel: ["Even the sea obeys him."]
  },
  james: {
    evening: ["The sun is setting."],
    storm: ["The sail will not hold!"],
    fear: ["The boat is full!"],
    calm: ["Peace, be still, he said."],
    marvel: ["We should not have been afraid."]
  },
  john: {
    evening: ["He is tired. He has gone to sleep."],
    storm: ["And still he sleeps."],
    fear: ["We perish!"],
    calm: ["The waves are gone."],
    marvel: ["What manner of man is this?"]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "crew" : role] || LINES.crew;
  const set = group[part] || LINES.crew.evening;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = [
  "Master, carest thou not that we perish?",
  "What manner of man is this",
  "Peace, be still"
];
