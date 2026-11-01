// What people say in the street. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among a crowd waiting to see someone pass.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the crowd, and what you hear when you greet one of them, by part of the story
  crowd: {
    street: [
      "He is coming this way!",
      "Make room, make room.",
      "I have heard so much of him.",
      ...GREET
    ],
    press: [
      "Stand back, I cannot see!",
      "Everyone is pushing.",
      "There he is, up the road!",
      ...GREET
    ],
    climb: ["Look at him go!", "Is that a grown man up a tree?", "What is he doing?", ...GREET],
    called: ["He stopped under the tree!", "He is looking up.", "He knows his name!", ...GREET],
    murmur: [
      "That he was gone to be guest with a man that is a sinner.",
      "Of all the houses in Jericho!",
      "A tax collector!",
      ...GREET
    ],
    restore: ["Half of everything?", "Fourfold?", "I never thought I would see it.", ...GREET]
  },
  zacchaeus: {
    street: ["I have heard of this man."],
    press: ["I cannot see over them all!"],
    climb: ["The sycomore tree. I will see him from there."],
    called: ["Lord, I will make haste!"],
    murmur: ["Receive him joyfully."],
    restore: ["Behold, Lord, the half of my goods I give to the poor"]
  },
  poor: {
    street: ["Spare a coin?", "Please, anything."],
    press: ["Spare a coin?", "Please, anything."],
    climb: ["A coin for the poor?", "Please, anything."],
    called: ["Who is that, up in the tree?"],
    murmur: ["What is happening at his house?"],
    restore: ["Bless you!", "Thank you, thank you.", "I never expected this."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "crowd" : role] || LINES.crowd;
  const set = group[part] || LINES.crowd.street;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = [
  "That he was gone to be guest with a man that is a sinner",
  "Behold, Lord, the half of my goods I give to the poor",
  "I restore him fourfold"
];
