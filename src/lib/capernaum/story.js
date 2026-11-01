// Fishers of men (Matthew 4:18–22) as four parts that run one after another, with the words of Scripture shown in each. The
// director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he is a soft light that
// walks along the shore, and the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["shore", "call", "boat", "leave"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { shore: 11000, call: 12000, boat: 12000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  shore: {
    ref: "Matthew 4:18",
    quotes: [
      [
        "Matthew 4:18",
        "And Jesus, walking by the sea of Galilee, saw two brethren, Simon called Peter, and Andrew his brother, casting a net into the sea: for they were fishers."
      ]
    ]
  },
  call: {
    ref: "Matthew 4:19–20",
    quotes: [
      ["Matthew 4:19", "And he saith unto them, Follow me, and I will make you fishers of men."],
      ["Matthew 4:20", "And they straightway left their nets, and followed him."]
    ]
  },
  boat: {
    ref: "Matthew 4:21",
    quotes: [
      [
        "Matthew 4:21",
        "And going on from thence, he saw other two brethren, James the son of Zebedee, and John his brother, in a ship with Zebedee their father, mending their nets; and he called them."
      ]
    ]
  },
  leave: {
    ref: "Matthew 4:22",
    quotes: [
      ["Matthew 4:22", "And they immediately left the ship and their father, and followed him."]
    ]
  }
};

// shore → call → boat → leave. The last stays while the four follow him along the shore.
export const directorMachine = makeDirector([
  { id: "shore", ms: MS.shore },
  { id: "call", ms: MS.call },
  { id: "boat", ms: MS.boat },
  { id: "leave" }
]);
