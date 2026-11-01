// Growing up in Nazareth (Luke 2:39–52) as five parts that run one after another, with the words of Scripture shown in each.
// The director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he is a soft light,
// at the workshop, then on the road to Jerusalem and among the teachers, and last of all home again.
import { makeDirector } from "../play/director.js";

export const PARTS = ["home", "feast", "lost", "found", "grow"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { home: 11000, feast: 12000, lost: 14000, found: 14000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  home: {
    ref: "Luke 2:39–40",
    quotes: [
      [
        "Luke 2:39",
        "And when they had performed all things according to the law of the Lord, they returned into Galilee, to their own city Nazareth."
      ],
      [
        "Luke 2:40",
        "And the child grew, and waxed strong in spirit, filled with wisdom: and the grace of God was upon him."
      ]
    ]
  },
  feast: {
    ref: "Luke 2:41–42",
    quotes: [
      ["Luke 2:41", "Now his parents went to Jerusalem every year at the feast of the passover."],
      [
        "Luke 2:42",
        "And when he was twelve years old, they went up to Jerusalem after the custom of the feast."
      ]
    ]
  },
  lost: {
    ref: "Luke 2:43–45",
    quotes: [
      [
        "Luke 2:43",
        "And when they had fulfilled the days, as they returned, the child Jesus tarried behind in Jerusalem; and Joseph and his mother knew not of it."
      ],
      [
        "Luke 2:44",
        "But they, supposing him to have been in the company, went a day’s journey; and they sought him among their kinsfolk and acquaintance."
      ],
      [
        "Luke 2:45",
        "And when they found him not, they turned back again to Jerusalem, seeking him."
      ]
    ]
  },
  found: {
    ref: "Luke 2:46–49",
    quotes: [
      [
        "Luke 2:46",
        "And it came to pass, that after three days they found him in the temple, sitting in the midst of the doctors, both hearing them, and asking them questions."
      ],
      ["Luke 2:47", "And all that heard him were astonished at his understanding and answers."],
      [
        "Luke 2:48",
        "And when they saw him, they were amazed: and his mother said unto him, Son, why hast thou thus dealt with us? behold, thy father and I have sought thee sorrowing."
      ],
      [
        "Luke 2:49",
        "And he said unto them, How is it that ye sought me? wist ye not that I must be about my Father’s business?"
      ]
    ]
  },
  grow: {
    ref: "Luke 2:50–52",
    quotes: [
      ["Luke 2:50", "And they understood not the saying which he spake unto them."],
      [
        "Luke 2:51",
        "And he went down with them, and came to Nazareth, and was subject unto them: but his mother kept all these sayings in her heart."
      ],
      ["Luke 2:52", "And Jesus increased in wisdom and stature, and in favour with God and man."]
    ]
  }
};

// home → feast → lost → found → grow. The last stays while the family is at home again.
export const directorMachine = makeDirector([
  { id: "home", ms: MS.home },
  { id: "feast", ms: MS.feast },
  { id: "lost", ms: MS.lost },
  { id: "found", ms: MS.found },
  { id: "grow" }
]);
