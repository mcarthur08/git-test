// Born in Bethlehem (Luke 2:8–20) as five parts that run one after another, with the words of Scripture shown in each. The
// director is an XState machine, so it can be run and tested without a screen. The angel and the heavenly host are never
// drawn as people: they are a light over the field and a host of lights in the sky, and the babe in the manger is a soft
// glow, so the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["field", "angel", "host", "haste", "return"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { field: 9000, angel: 15000, host: 11000, haste: 15000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  field: {
    ref: "Luke 2:8",
    quotes: [
      [
        "Luke 2:8",
        "And there were in the same country shepherds abiding in the field, keeping watch over their flock by night."
      ]
    ]
  },
  angel: {
    ref: "Luke 2:9–12",
    quotes: [
      [
        "Luke 2:9",
        "And, lo, the angel of the Lord came upon them, and the glory of the Lord shone round about them: and they were sore afraid."
      ],
      [
        "Luke 2:10",
        "And the angel said unto them, Fear not: for, behold, I bring you good tidings of great joy, which shall be to all people."
      ],
      [
        "Luke 2:11",
        "For unto you is born this day in the city of David a Saviour, which is Christ the Lord."
      ],
      [
        "Luke 2:12",
        "And this shall be a sign unto you; Ye shall find the babe wrapped in swaddling clothes, lying in a manger."
      ]
    ]
  },
  host: {
    ref: "Luke 2:13–14",
    quotes: [
      [
        "Luke 2:13",
        "And suddenly there was with the angel a multitude of the heavenly host praising God, and saying,"
      ],
      ["Luke 2:14", "Glory to God in the highest, and on earth peace, good will toward men."]
    ]
  },
  haste: {
    ref: "Luke 2:15–16",
    quotes: [
      [
        "Luke 2:15",
        "And it came to pass, as the angels were gone away from them into heaven, the shepherds said one to another, Let us now go even unto Bethlehem, and see this thing which is come to pass, which the Lord hath made known unto us."
      ],
      [
        "Luke 2:16",
        "And they came with haste, and found Mary, and Joseph, and the babe lying in a manger."
      ]
    ]
  },
  return: {
    ref: "Luke 2:17–20",
    quotes: [
      [
        "Luke 2:17",
        "And when they had seen it, they made known abroad the saying which was told them concerning this child."
      ],
      [
        "Luke 2:18",
        "And all they that heard it wondered at those things which were told them by the shepherds."
      ],
      ["Luke 2:19", "But Mary kept all these things, and pondered them in her heart."],
      [
        "Luke 2:20",
        "And the shepherds returned, glorifying and praising God for all the things that they had heard and seen, as it was told unto them."
      ]
    ]
  }
};

// field → angel → host → haste → return. The last stays while the shepherds tell what they have seen.
export const directorMachine = makeDirector([
  { id: "field", ms: MS.field },
  { id: "angel", ms: MS.angel },
  { id: "host", ms: MS.host },
  { id: "haste", ms: MS.haste },
  { id: "return" }
]);
