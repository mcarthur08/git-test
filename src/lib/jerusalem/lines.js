// What people say in the upper room. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among friends sharing a meal.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the other disciples, and what you hear when you greet one of them, by part of the story
  guest: {
    prepare: ["Is the room ready yet?", "Peter and John have gone ahead.", ...GREET],
    gather: ["The hour has come.", "Find a place at the table.", "He is here with us.", ...GREET],
    cup: ["Take the cup and pass it on.", "Listen to what he says.", ...GREET],
    bread: ["He gave thanks, and broke it.", "Remember his words.", ...GREET],
    supper: ["I will not forget this night.", "The cup after supper.", ...GREET]
  },
  peter: {
    prepare: ["Where wilt thou that we prepare?", "A man with a pitcher, he said."],
    gather: ["Master, we are ready.", "There is a place for you."],
    cup: ["Pass the cup along.", "I will drink with him."],
    bread: ["Take it, and eat.", "Remember him."],
    supper: ["I do not understand it all yet."]
  },
  john: {
    prepare: ["The table must be laid for all.", "Mind the bread, Peter."],
    gather: ["Let me sit close to him.", "The Master is here."],
    cup: ["Divide it among us.", "Take a sip, and pass it."],
    bread: ["Broken for us.", "Take, and share it."],
    supper: ["Remember him always."]
  },
  andrew: {
    prepare: ["Is the lamb ready?", "I will wait by the door."],
    gather: ["Make room, friends.", "Here he comes."],
    cup: ["Pass it to your brother.", "A cup for each of us."],
    bread: ["Thank you, Master.", "Break it and share."],
    supper: ["Let us keep this supper."]
  },
  james: {
    prepare: ["The upper room is large.", "The lamps are lit."],
    gather: ["We are all here.", "Sit down, brothers."],
    cup: ["Pass it round.", "One cup for all of us."],
    bread: ["He brake it for us.", "Eat, and remember."],
    supper: ["Peace to this table."]
  },
  goodman: {
    prepare: [
      "Come in, the room is ready.",
      "The upper room is furnished for you.",
      "Welcome, friends."
    ],
    gather: ["Take your places.", "The Master is welcome here."],
    cup: ["May the cup be blessed."],
    bread: ["May the bread be blessed."],
    supper: ["Peace be with this house."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "me" ? "guest" : role] || LINES.guest;
  const set = group[part] || LINES.guest.prepare;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = ["Where wilt thou that we prepare?"];
