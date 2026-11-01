// What people say in the field and at the stable. What quotes Scripture is word for word from the KJV (and tested against
// it); the rest is ordinary talk among shepherds and travellers.
const GREET = ["Peace be with you!", "Shalom!", "Grace to you."];

export const LINES = {
  // the fellow shepherds, and what you hear when you greet one of them, by part of the story
  town: {
    field: ["A quiet night.", "Count the sheep once more.", "The fire is warm.", ...GREET],
    angel: ["What is that light?", "I am afraid!", "Who is speaking?", ...GREET],
    host: ["Listen to the singing!", "The whole sky is full of voices.", ...GREET],
    haste: ["Let us go and see.", "Hurry, to the town!", ...GREET],
    return: ["Did you hear what the shepherds said?", "I wonder at it.", ...GREET]
  },
  shepherd: {
    field: ["Keep watch, friends.", "All is well with the flock.", "The night is long."],
    angel: ["We are sore afraid!", "A light from heaven!", "Hush, and listen."],
    host: ["Glory to God in the highest!", "Peace on earth!"],
    haste: ["Let us now go even unto Bethlehem", "Come, quickly!", "Leave the flock a while."],
    return: ["We have seen him!", "Go and tell everyone.", "Praise God!"]
  },
  mary: {
    field: ["Hush, he sleeps."],
    angel: ["A strange light over the fields."],
    host: ["Do you hear singing, Joseph?"],
    haste: ["Welcome, shepherds."],
    return: ["I will keep these things in my heart."]
  },
  joseph: {
    field: ["The stable is warm enough."],
    angel: ["What is that light?"],
    host: ["Such music!"],
    haste: ["Come in, come in."],
    return: ["God is with us."]
  }
};

// A line for a role in a part of the story; `seed` (any number) picks which, so it varies without being random.
export function lineFor(role, part, seed = 0) {
  const group = LINES[role === "guest" || role === "me" ? "town" : role] || LINES.town;
  const set = group[part] || LINES.town.field;
  return set[Math.abs(seed) % set.length];
}

// What is spoken in the passages themselves, which the tests check against the KJV text.
export const SCRIPTURE_LINES = ["Glory to God in the highest", "Let us now go even unto Bethlehem"];
