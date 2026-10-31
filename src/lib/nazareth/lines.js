// What people say in Nazareth. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among neighbours and travellers.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the people of the town, and what you hear when you greet one of them, by part of the story
  town: {
    home: ["Joseph's boards are always straight.", "It is a good town to grow up in.", ...GREET],
    feast: [
      "Are you going up for the passover?",
      "The whole village is walking to Jerusalem.",
      "Pack bread for three days.",
      ...GREET
    ],
    lost: [
      "Have you seen the boy?",
      "I thought he was with the family.",
      "They have gone back to look for him.",
      ...GREET
    ],
    found: [
      "The boy is asking the teachers questions!",
      "Listen to his answers.",
      "Twelve years old, and not afraid.",
      ...GREET
    ],
    grow: [
      "Back in the workshop already.",
      "He is no trouble to his parents.",
      "He grows tall, that one.",
      ...GREET
    ]
  },
  joseph: {
    home: ["Hand me the square.", "A board must be true.", "Measure twice."],
    feast: ["Is the bread packed?", "We leave at first light."],
    lost: ["He must be with the company.", "Where could he be?", "We must go back."],
    found: ["Thank God, he is safe."],
    grow: ["Back to work, then.", "Mind the shavings."]
  },
  mary: {
    home: ["The bread is baking.", "Come in, come in."],
    feast: ["Take the lamp.", "Keep close to your cousins."],
    lost: ["Have you seen our son?", "He is only twelve."],
    found: ["Son, why hast thou thus dealt with us?", "We sought thee sorrowing."],
    grow: ["I will keep all this in my heart."]
  },
  teacher: {
    home: ["The law is a delight."],
    feast: ["Peace on your journey."],
    lost: ["Who is that boy among us?"],
    found: ["Where did he learn such things?", "He understands the law."],
    grow: ["Peace go with you."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "town" : role] || LINES.town;
  const set = group[part] || LINES.town.home;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passage itself, which the tests check against the KJV text.
export const SCRIPTURE_LINES = ["Son, why hast thou thus dealt with us?"];
