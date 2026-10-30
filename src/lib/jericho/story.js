// Zacchaeus in the sycamore (Luke 19:1–10) as six parts that run one after another, with the words of Scripture shown in
// each. The director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he is a
// soft light that passes along the street, and the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["street", "press", "climb", "called", "murmur", "restore"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { street: 9000, press: 11000, climb: 9000, called: 13000, murmur: 9000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  street: {
    ref: "Luke 19:1–2",
    quotes: [
      ["Luke 19:1", "And Jesus entered and passed through Jericho."],
      [
        "Luke 19:2",
        "And, behold, there was a man named Zacchaeus, which was the chief among the publicans, and he was rich."
      ]
    ]
  },
  press: {
    ref: "Luke 19:3",
    quotes: [
      [
        "Luke 19:3",
        "And he sought to see Jesus who he was; and could not for the press, because he was little of stature."
      ]
    ]
  },
  climb: {
    ref: "Luke 19:4",
    quotes: [
      [
        "Luke 19:4",
        "And he ran before, and climbed up into a sycomore tree to see him: for he was to pass that way."
      ]
    ]
  },
  called: {
    ref: "Luke 19:5–6",
    quotes: [
      [
        "Luke 19:5",
        "And when Jesus came to the place, he looked up, and saw him, and said unto him, Zacchaeus, make haste, and come down; for to day I must abide at thy house."
      ],
      ["Luke 19:6", "And he made haste, and came down, and received him joyfully."]
    ]
  },
  murmur: {
    ref: "Luke 19:7",
    quotes: [
      [
        "Luke 19:7",
        "And when they saw it, they all murmured, saying, That he was gone to be guest with a man that is a sinner."
      ]
    ]
  },
  restore: {
    ref: "Luke 19:8–10",
    quotes: [
      [
        "Luke 19:8",
        "And Zacchaeus stood, and said unto the Lord; Behold, Lord, the half of my goods I give to the poor; and if I have taken any thing from any man by false accusation, I restore him fourfold."
      ],
      [
        "Luke 19:9",
        "And Jesus said unto him, This day is salvation come to this house, forsomuch as he also is a son of Abraham."
      ],
      ["Luke 19:10", "For the Son of man is come to seek and to save that which was lost."]
    ]
  }
};

// street → press → climb → called → murmur → restore. The last stays while the poor are given what he promised.
export const directorMachine = makeDirector([
  { id: "street", ms: MS.street },
  { id: "press", ms: MS.press },
  { id: "climb", ms: MS.climb },
  { id: "called", ms: MS.called },
  { id: "murmur", ms: MS.murmur },
  { id: "restore" }
]);
