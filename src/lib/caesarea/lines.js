// What people say at the foot of the cliffs. What quotes Scripture is word for word from the KJV (and tested against it);
// the rest is ordinary talk among travellers and friends.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the people of the place, and what you hear when you greet one of them, by part of the story
  town: {
    ask: ["The water comes out of the cliff itself.", "Who is the man with the twelve?", ...GREET],
    say: ["Some say a prophet has come.", "Everyone has an opinion.", ...GREET],
    confess: ["Did you hear Simon?", "What a thing to say aloud.", ...GREET],
    rock: ["Look, they are laying stones.", "A rock is a good place to build.", ...GREET],
    keys: ["Keys? What does he mean?", "They look very glad.", ...GREET]
  },
  peter: {
    ask: ["He is asking about himself.", "Let us think before we answer."],
    say: ["Yes, I have heard those too."],
    confess: ["Thou art the Christ, the Son of the living God."],
    rock: ["I do not deserve this.", "Build on him, not on me."],
    keys: ["I will tell no one yet.", "Heaven's keys, in my hand!"]
  },
  andrew: {
    ask: ["Why does he ask us this?", "Rabbi, the whole town talks of you."],
    say: ["Some say that thou art John the Baptist"],
    confess: ["Simon has said it."],
    rock: ["Pass me a stone, Simon."],
    keys: ["We will keep quiet for now."]
  },
  james: {
    ask: ["Listen to the spring."],
    say: ["Jeremias, or one of the prophets"],
    confess: ["He has put it into words."],
    rock: ["Another stone, John!"],
    keys: ["Not a word, then."]
  },
  john: {
    ask: ["He asks us, not the crowd."],
    say: ["Some say Elias, and some say a prophet."],
    confess: ["Yes. That is who he is."],
    rock: ["Here is a good flat one."],
    keys: ["Peter, hold them tight."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "town" : role] || LINES.town;
  const set = group[part] || LINES.town.ask;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = [
  "Some say that thou art John the Baptist",
  "Jeremias, or one of the prophets",
  "Thou art the Christ, the Son of the living God"
];
