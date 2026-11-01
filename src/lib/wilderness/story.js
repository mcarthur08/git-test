// Tempted in the wilderness (Matthew 4:1–11) as five parts that run one after another, with the words of Scripture shown in
// each. The director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he is a soft
// light that walks across the wilderness, and the tempter is only a shadow that drifts beside him. Every time, Jesus
// answers with what is written.
import { makeDirector } from "../play/director.js";

export const PARTS = ["fast", "stones", "pinnacle", "mountain", "angels"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { fast: 10000, stones: 13000, pinnacle: 13000, mountain: 14000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  fast: {
    ref: "Matthew 4:1–2",
    quotes: [
      [
        "Matthew 4:1",
        "Then was Jesus led up of the Spirit into the wilderness to be tempted of the devil."
      ],
      [
        "Matthew 4:2",
        "And when he had fasted forty days and forty nights, he was afterward an hungred."
      ]
    ]
  },
  stones: {
    ref: "Matthew 4:3–4",
    quotes: [
      [
        "Matthew 4:3",
        "And when the tempter came to him, he said, If thou be the Son of God, command that these stones be made bread."
      ],
      [
        "Matthew 4:4",
        "But he answered and said, It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God."
      ]
    ]
  },
  pinnacle: {
    ref: "Matthew 4:5–7",
    quotes: [
      [
        "Matthew 4:5",
        "Then the devil taketh him up into the holy city, and setteth him on a pinnacle of the temple,"
      ],
      [
        "Matthew 4:6",
        "And saith unto him, If thou be the Son of God, cast thyself down: for it is written, He shall give his angels charge concerning thee: and in their hands they shall bear thee up, lest at any time thou dash thy foot against a stone."
      ],
      [
        "Matthew 4:7",
        "Jesus said unto him, It is written again, Thou shalt not tempt the Lord thy God."
      ]
    ]
  },
  mountain: {
    ref: "Matthew 4:8–10",
    quotes: [
      [
        "Matthew 4:8",
        "Again, the devil taketh him up into an exceeding high mountain, and sheweth him all the kingdoms of the world, and the glory of them;"
      ],
      [
        "Matthew 4:9",
        "And saith unto him, All these things will I give thee, if thou wilt fall down and worship me."
      ],
      [
        "Matthew 4:10",
        "Then saith Jesus unto him, Get thee hence, Satan: for it is written, Thou shalt worship the Lord thy God, and him only shalt thou serve."
      ]
    ]
  },
  angels: {
    ref: "Matthew 4:11",
    quotes: [
      [
        "Matthew 4:11",
        "Then the devil leaveth him, and, behold, angels came and ministered unto him."
      ]
    ]
  }
};

// fast → stones → pinnacle → mountain → angels. The last stays while the angels minister to him.
export const directorMachine = makeDirector([
  { id: "fast", ms: MS.fast },
  { id: "stones", ms: MS.stones },
  { id: "pinnacle", ms: MS.pinnacle },
  { id: "mountain", ms: MS.mountain },
  { id: "angels" }
]);
