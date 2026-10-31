// What people say in the wilderness. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among people crossing the desert.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // travellers, and what you hear when you greet one of them, by part of the story
  guest: {
    fast: [
      "Not a drop of water out here.",
      "That light has walked all day without eating.",
      "The sand is hot even in the evening.",
      ...GREET
    ],
    stones: [
      "Those stones look just like loaves.",
      "He is so hungry, and still he will not.",
      "Something dark is drifting beside the light.",
      ...GREET
    ],
    pinnacle: [
      "That is a long way down.",
      "The light is standing at the foot of the tower.",
      "God does not need to be tested.",
      ...GREET
    ],
    mountain: [
      "You can see so far from up there.",
      "All those kingdoms, and he wants none of them.",
      "Only God is worth serving.",
      ...GREET
    ],
    angels: [
      "Look, the shadow is gone!",
      "Angels! They are looking after him.",
      "The wilderness is quiet again.",
      ...GREET
    ]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role] || LINES.guest;
  const set = group[part] || LINES.guest.fast;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text. These are the answers Jesus gave,
// and the three you can say yourself, in the order they were given.
export const SCRIPTURE_LINES = [
  "Man shall not live by bread alone",
  "Thou shalt not tempt the Lord thy God",
  "Thou shalt worship the Lord thy God, and him only shalt thou serve",
  "Get thee hence, Satan"
];

// a short prayer when you pray on a rock
export const PRAYERS = ["Help me trust you.", "Give me what I need today.", "Keep me from evil."];
