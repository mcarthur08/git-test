// What people say at Bethany. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among neighbours and a family.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the neighbours, and what you hear when you greet one of them, by part of the story
  town: {
    grave: [
      "Four days now. So sad.",
      "Behold how he loved him!",
      "We came to comfort Mary.",
      ...GREET
    ],
    stone: [
      "What is he going to do?",
      "Why is the stone being moved?",
      "Stand back a little.",
      ...GREET
    ],
    forth: ["I cannot believe my eyes!", "He is alive!", "Look, he is walking!", ...GREET],
    supper: [
      "What a happy house tonight.",
      "Lazarus is at the table!",
      "Martha has outdone herself.",
      ...GREET
    ],
    anoint: [
      "What a lovely fragrance!",
      "The whole house smells of it.",
      "That jar was costly.",
      ...GREET
    ]
  },
  mary: {
    grave: ["Lord, if thou hadst been here, my brother had not died"],
    stone: ["I believe, Lord."],
    forth: ["My brother!", "Let me help with those cloths."],
    supper: ["I have something for him."],
    anoint: ["It is all I have to give.", "Thank you, Lord."]
  },
  martha: {
    grave: ["Come, sit with us a while."],
    stone: ["Lord, by this time he stinketh"],
    forth: ["My brother is breathing!", "Oh, thank God."],
    supper: ["More bread coming!", "Mind the dishes."],
    anoint: ["The whole house!", "Welcome, Lord."]
  },
  lazarus: {
    forth: ["Where am I?", "Loose me, so that I may walk."],
    supper: ["It is good to sit at table.", "Come, eat with us."],
    anoint: ["Thank you for everything."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "town" : role] || LINES.town;
  const set = group[part] || LINES.town.supper;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = [
  "Lord, if thou hadst been here, my brother had not died",
  "Lord, by this time he stinketh",
  "Behold how he loved him"
];
