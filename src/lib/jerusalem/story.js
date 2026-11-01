// The Passover in the upper room (Luke 22:7–20) as five parts that run one after another, with the words of Scripture shown
// in each. The director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he is a
// soft light that comes into the room and stays at the head of the table, and the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["prepare", "gather", "cup", "bread", "supper"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { prepare: 14000, gather: 13000, cup: 13000, bread: 14000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  prepare: {
    ref: "Luke 22:8–12",
    quotes: [
      [
        "Luke 22:8",
        "And he sent Peter and John, saying, Go and prepare us the passover, that we may eat."
      ],
      ["Luke 22:12", "And he shall shew you a large upper room furnished: there make ready."]
    ]
  },
  gather: {
    ref: "Luke 22:14–15",
    quotes: [
      ["Luke 22:14", "And when the hour was come, he sat down, and the twelve apostles with him."],
      [
        "Luke 22:15",
        "And he said unto them, With desire I have desired to eat this passover with you before I suffer:"
      ]
    ]
  },
  cup: {
    ref: "Luke 22:17",
    quotes: [
      [
        "Luke 22:17",
        "And he took the cup, and gave thanks, and said, Take this, and divide it among yourselves:"
      ]
    ]
  },
  bread: {
    ref: "Luke 22:19",
    quotes: [
      [
        "Luke 22:19",
        "And he took bread, and gave thanks, and brake it, and gave unto them, saying, This is my body which is given for you: this do in remembrance of me."
      ]
    ]
  },
  supper: {
    ref: "Luke 22:20",
    quotes: [
      [
        "Luke 22:20",
        "Likewise also the cup after supper, saying, This cup is the new testament in my blood, which is shed for you."
      ]
    ]
  }
};

// prepare → gather → cup → bread → supper. The last stays while the cup is shared round the table.
export const directorMachine = makeDirector([
  { id: "prepare", ms: MS.prepare },
  { id: "gather", ms: MS.gather },
  { id: "cup", ms: MS.cup },
  { id: "bread", ms: MS.bread },
  { id: "supper" }
]);
