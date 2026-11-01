// What people say on the hillside. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among a hungry crowd.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you.", "Good to see you."];

export const LINES = {
  // the crowd, and what you hear when you greet one of them, by part of the story
  crowd: {
    day: [
      "It has been a long day.",
      "I am so hungry.",
      "Where will we find food out here?",
      ...GREET
    ],
    give: ["Five loaves for all of us?", "There is nothing to buy out here.", ...GREET],
    sit: ["Sit down, friend. There is much grass.", "Here, there is room.", ...GREET],
    bless: ["Hush, he is giving thanks.", "Look up there.", "Quiet now.", ...GREET],
    feed: ["Thank you!", "I have never tasted bread like this.", "Here, take some.", ...GREET],
    gather: ["Look, there is so much left!", "Twelve baskets!", "Nothing was wasted.", ...GREET]
  },
  // the people of the story
  andrew: {
    day: ["The day is almost over."],
    give: [
      "There is a lad here, which hath five barley loaves, and two small fishes: but what are they among so many?"
    ],
    sit: ["Make them sit down, as he said."],
    bless: ["Look, the bread keeps coming."],
    feed: ["Take, and eat."],
    gather: ["Gather up the fragments."]
  },
  philip: {
    day: [
      "Two hundred pennyworth of bread is not sufficient for them, that every one of them may take a little."
    ],
    give: ["We have no more but five loaves and two fishes"],
    sit: ["By fifties, in companies."],
    bless: ["I cannot believe my eyes."],
    feed: ["There is enough for everyone."],
    gather: ["Not a crumb lost."]
  },
  disciple: {
    day: ["Send the multitude away"],
    give: ["We have no more but five loaves and two fishes"],
    sit: ["Please sit down in your company."],
    bless: ["Give thanks."],
    feed: ["Pass it along."],
    gather: ["Fill the basket."]
  },
  lad: {
    day: ["I have a little food with me."],
    give: ["Here are my five loaves and two fishes."],
    sit: ["Can I sit here?"],
    bless: ["That is my bread!"],
    feed: ["I gave what I had."],
    gather: ["So many baskets!"]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "crowd" : role] || LINES.crowd;
  const set = group[part] || LINES.crowd.day;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = [
  "Send the multitude away",
  "We have no more but five loaves and two fishes",
  "Two hundred pennyworth of bread is not sufficient for them, that every one of them may take a little.",
  "There is a lad here, which hath five barley loaves, and two small fishes: but what are they among so many?"
];
