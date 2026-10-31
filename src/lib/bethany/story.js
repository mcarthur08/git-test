// Bethany (John 11–12) as five parts that run one after another, with the words of Scripture shown in each: the grave of
// Lazarus, the stone taken away, "Lazarus, come forth", the supper six days before the passover, and Mary anointing the
// feet of Jesus. The director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he
// is a soft light that walks from the road to the grave and then to the table, and the story is told in the words of the
// passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["grave", "stone", "forth", "supper", "anoint"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { grave: 11000, stone: 12000, forth: 13000, supper: 12000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  grave: {
    ref: "John 11:32–35",
    quotes: [
      [
        "John 11:32",
        "Then when Mary was come where Jesus was, and saw him, she fell down at his feet, saying unto him, Lord, if thou hadst been here, my brother had not died."
      ],
      ["John 11:35", "Jesus wept."]
    ]
  },
  stone: {
    ref: "John 11:38–41",
    quotes: [
      [
        "John 11:38",
        "Jesus therefore again groaning in himself cometh to the grave. It was a cave, and a stone lay upon it."
      ],
      ["John 11:39", "Jesus said, Take ye away the stone."],
      ["John 11:41", "Then they took away the stone from the place where the dead was laid."]
    ]
  },
  forth: {
    ref: "John 11:43–44",
    quotes: [
      [
        "John 11:43",
        "And when he thus had spoken, he cried with a loud voice, Lazarus, come forth."
      ],
      [
        "John 11:44",
        "And he that was dead came forth, bound hand and foot with graveclothes: and his face was bound about with a napkin. Jesus saith unto them, Loose him, and let him go."
      ]
    ]
  },
  supper: {
    ref: "John 12:1–2",
    quotes: [
      [
        "John 12:1",
        "Then Jesus six days before the passover came to Bethany, where Lazarus was, which had been dead, whom he raised from the dead."
      ],
      [
        "John 12:2",
        "There they made him a supper; and Martha served: but Lazarus was one of them that sat at the table with him."
      ]
    ]
  },
  anoint: {
    ref: "John 12:3",
    quotes: [
      [
        "John 12:3",
        "Then took Mary a pound of ointment of spikenard, very costly, and anointed the feet of Jesus, and wiped his feet with her hair: and the house was filled with the odour of the ointment."
      ]
    ]
  }
};

// grave → stone → forth → supper → anoint. The last stays while the house fills with the odour of the ointment.
export const directorMachine = makeDirector([
  { id: "grave", ms: MS.grave },
  { id: "stone", ms: MS.stone },
  { id: "forth", ms: MS.forth },
  { id: "supper", ms: MS.supper },
  { id: "anoint" }
]);
