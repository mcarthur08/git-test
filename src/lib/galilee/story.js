// "Peace, be still" (Mark 4:35–41) as five parts that run one after another, with the words of Scripture shown in each. The
// director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he sleeps on a pillow
// at the back of the boat, and the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["evening", "storm", "fear", "calm", "marvel"];

// How long each part lasts if nothing speeds it up. The fear lasts until he is woken, or this long at most.
export const MS = { evening: 9000, storm: 12000, fear: 40000, calm: 9000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  evening: {
    ref: "Mark 4:35–36",
    quotes: [
      [
        "Mark 4:35",
        "And the same day, when the even was come, he saith unto them, Let us pass over unto the other side."
      ],
      [
        "Mark 4:36",
        "And when they had sent away the multitude, they took him even as he was in the ship. And there were also with him other little ships."
      ]
    ]
  },
  storm: {
    ref: "Mark 4:37",
    quotes: [
      [
        "Mark 4:37",
        "And there arose a great storm of wind, and the waves beat into the ship, so that it was now full."
      ]
    ]
  },
  fear: {
    ref: "Mark 4:38",
    quotes: [
      [
        "Mark 4:38",
        "And he was in the hinder part of the ship, asleep on a pillow: and they awake him, and say unto him, Master, carest thou not that we perish?"
      ]
    ]
  },
  calm: {
    ref: "Mark 4:39",
    quotes: [
      [
        "Mark 4:39",
        "And he arose, and rebuked the wind, and said unto the sea, Peace, be still. And the wind ceased, and there was a great calm."
      ]
    ]
  },
  marvel: {
    ref: "Mark 4:40–41",
    quotes: [
      [
        "Mark 4:40",
        "And he said unto them, Why are ye so fearful? how is it that ye have no faith?"
      ],
      [
        "Mark 4:41",
        "And they feared exceedingly, and said one to another, What manner of man is this, that even the wind and the sea obey him?"
      ]
    ]
  }
};

// evening → storm → fear → calm → marvel. The fear ends when he is woken (WOKEN), and the calm leads on by itself.
export const directorMachine = makeDirector([
  { id: "evening", ms: MS.evening },
  { id: "storm", ms: MS.storm },
  { id: "fear", ms: MS.fear, on: { WOKEN: "calm" } },
  { id: "calm", ms: MS.calm },
  { id: "marvel" }
]);
