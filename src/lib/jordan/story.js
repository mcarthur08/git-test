// Baptized in the Jordan (Matthew 3:13–17) as five parts that run one after another, with the words of Scripture shown in
// each. The director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he is a soft
// light that walks down to the river, and the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["come", "forbid", "baptized", "opened", "voice"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { come: 11000, forbid: 12000, baptized: 10000, opened: 12000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  come: {
    ref: "Matthew 3:13",
    quotes: [
      ["Matthew 3:13", "Then cometh Jesus from Galilee to Jordan unto John, to be baptized of him."]
    ]
  },
  forbid: {
    ref: "Matthew 3:14–15",
    quotes: [
      [
        "Matthew 3:14",
        "But John forbad him, saying, I have need to be baptized of thee, and comest thou to me?"
      ],
      [
        "Matthew 3:15",
        "And Jesus answering said unto him, Suffer it to be so now: for thus it becometh us to fulfil all righteousness. Then he suffered him."
      ]
    ]
  },
  baptized: {
    ref: "Matthew 3:16",
    quotes: [
      ["Matthew 3:16", "And Jesus, when he was baptized, went up straightway out of the water"]
    ]
  },
  opened: {
    ref: "Matthew 3:16",
    quotes: [
      [
        "Matthew 3:16",
        "and, lo, the heavens were opened unto him, and he saw the Spirit of God descending like a dove, and lighting upon him"
      ]
    ]
  },
  voice: {
    ref: "Matthew 3:17",
    quotes: [
      [
        "Matthew 3:17",
        "And lo a voice from heaven, saying, This is my beloved Son, in whom I am well pleased."
      ]
    ]
  }
};

// come → forbid → baptized → opened → voice. The last stays while the people look up at the dove.
export const directorMachine = makeDirector([
  { id: "come", ms: MS.come },
  { id: "forbid", ms: MS.forbid },
  { id: "baptized", ms: MS.baptized },
  { id: "opened", ms: MS.opened },
  { id: "voice" }
]);
