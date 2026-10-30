// The feeding of the five thousand (Luke 9:10–17, John 6:1–13) as six parts that run one after another, with the words of
// Scripture shown in each. The director is an XState machine, so it can be run and tested without a screen. Jesus is never
// drawn: the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["day", "give", "sit", "bless", "feed", "gather"];

// How long each part lasts if nothing speeds it up (the last one stays until the baskets are gathered).
export const MS = { day: 9000, give: 8000, sit: 11000, bless: 9000, feed: 45000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  day: {
    ref: "Luke 9:12",
    quotes: [
      [
        "Luke 9:12",
        "And when the day began to wear away, then came the twelve, and said unto him, Send the multitude away, that they may go into the towns and country round about, and lodge, and get victuals: for we are here in a desert place."
      ]
    ]
  },
  give: {
    ref: "Luke 9:13, John 6:9",
    quotes: [
      [
        "Luke 9:13",
        "But he said unto them, Give ye them to eat. And they said, We have no more but five loaves and two fishes; except we should go and buy meat for all this people."
      ],
      [
        "John 6:9",
        "There is a lad here, which hath five barley loaves, and two small fishes: but what are they among so many?"
      ]
    ]
  },
  sit: {
    ref: "Luke 9:14–15",
    quotes: [
      [
        "Luke 9:14",
        "For they were about five thousand men. And he said to his disciples, Make them sit down by fifties in a company."
      ],
      ["Luke 9:15", "And they did so, and made them all sit down."]
    ]
  },
  bless: {
    ref: "Luke 9:16",
    quotes: [
      [
        "Luke 9:16",
        "Then he took the five loaves and the two fishes, and looking up to heaven, he blessed them, and brake, and gave to the disciples to set before the multitude."
      ]
    ]
  },
  feed: {
    ref: "John 6:11, Luke 9:17",
    quotes: [
      [
        "John 6:11",
        "And Jesus took the loaves; and when he had given thanks, he distributed to the disciples, and the disciples to them that were set down; and likewise of the fishes as much as they would."
      ],
      ["Luke 9:17", "And they did eat, and were all filled:"]
    ]
  },
  gather: {
    ref: "John 6:12, Luke 9:17",
    quotes: [
      [
        "John 6:12",
        "When they were filled, he said unto his disciples, Gather up the fragments that remain, that nothing be lost."
      ],
      ["Luke 9:17", "and there was taken up of fragments that remained to them twelve baskets."]
    ]
  }
};

// day → give → sit → bless → feed → gather. Feeding ends as soon as every company has been fed (ALL_SERVED).
export const directorMachine = makeDirector([
  { id: "day", ms: MS.day },
  { id: "give", ms: MS.give },
  { id: "sit", ms: MS.sit },
  { id: "bless", ms: MS.bless },
  { id: "feed", ms: MS.feed, on: { ALL_SERVED: "gather" } },
  { id: "gather" }
]);
