// What people say on the shore. What quotes Scripture is word for word from the KJV (and tested against it); the rest is
// ordinary talk among fishing people.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the people of the town, and what you hear when you greet one of them, by part of the story
  town: {
    shore: ["Any fish today?", "The water is calm this morning.", "Good casting!", ...GREET],
    call: [
      "Follow me, and I will make you fishers of men.",
      "Who is that walking along the shore?",
      "They have left their nets!",
      ...GREET
    ],
    boat: ["Those nets will not mend themselves.", "Look, he has stopped at the boat.", ...GREET],
    leave: ["All four of them, gone with him.", "They left everything.", ...GREET]
  },
  peter: {
    shore: ["One more cast.", "The fish are shy today."],
    call: ["Who is this man?", "We will follow."],
    boat: ["Come, James! Come, John!"],
    leave: ["We are not turning back."]
  },
  andrew: {
    shore: ["Pull it in slowly.", "There is a good shoal."],
    call: ["Follow him, Simon!", "Fishers of men?"],
    boat: ["They are calling you too."],
    leave: ["Walk with us."]
  },
  james: {
    shore: ["Hold the net, John.", "Almost mended."],
    call: ["Is that Simon, leaving his nets?"],
    boat: ["He is calling us."],
    leave: ["Goodbye, father."]
  },
  john: {
    shore: ["The knot is torn again.", "Pass me the needle."],
    call: ["Look, they are going after him."],
    boat: ["He is calling us!"],
    leave: ["Goodbye, father."]
  },
  zebedee: {
    shore: ["Mind the nets, my sons."],
    call: ["What is happening on the shore?"],
    boat: ["Go on, my sons."],
    leave: ["Go with God, my sons."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "town" : role] || LINES.town;
  const set = group[part] || LINES.town.shore;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = ["Follow me, and I will make you fishers of men"];
