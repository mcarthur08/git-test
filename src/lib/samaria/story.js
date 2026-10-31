// Jesus at Jacob's well in Samaria (Luke 9:51; John 4) as five parts that run one after another, with the words of Scripture
// shown in each. The director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he is
// a soft light that comes down the road and sits on the edge of the well, and the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["road", "well", "living", "tell", "believe"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { road: 11000, well: 12000, living: 13000, tell: 11000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  road: {
    ref: "Luke 9:51; John 4:4",
    quotes: [
      ["Luke 9:51", "he stedfastly set his face to go to Jerusalem,"],
      ["John 4:4", "And he must needs go through Samaria."]
    ]
  },
  well: {
    ref: "John 4:6–7",
    quotes: [
      [
        "John 4:6",
        "Now Jacob’s well was there. Jesus therefore, being wearied with his journey, sat thus on the well: and it was about the sixth hour."
      ],
      [
        "John 4:7",
        "There cometh a woman of Samaria to draw water: Jesus saith unto her, Give me to drink."
      ]
    ]
  },
  living: {
    ref: "John 4:10, 14",
    quotes: [
      [
        "John 4:10",
        "If thou knewest the gift of God, and who it is that saith to thee, Give me to drink; thou wouldest have asked of him, and he would have given thee living water."
      ],
      [
        "John 4:14",
        "But whosoever drinketh of the water that I shall give him shall never thirst; but the water that I shall give him shall be in him a well of water springing up into everlasting life."
      ]
    ]
  },
  tell: {
    ref: "John 4:15, 28–29",
    quotes: [
      [
        "John 4:15",
        "The woman saith unto him, Sir, give me this water, that I thirst not, neither come hither to draw."
      ],
      [
        "John 4:28",
        "The woman then left her waterpot, and went her way into the city, and saith to the men,"
      ],
      [
        "John 4:29",
        "Come, see a man, which told me all things that ever I did: is not this the Christ?"
      ]
    ]
  },
  believe: {
    ref: "John 4:30, 39",
    quotes: [
      ["John 4:30", "Then they went out of the city, and came unto him."],
      [
        "John 4:39",
        "And many of the Samaritans of that city believed on him for the saying of the woman, which testified, He told me all that ever I did."
      ]
    ]
  }
};

// road → well → living → tell → believe. The last stays while the people of Sychar gather round him.
export const directorMachine = makeDirector([
  { id: "road", ms: MS.road },
  { id: "well", ms: MS.well },
  { id: "living", ms: MS.living },
  { id: "tell", ms: MS.tell },
  { id: "believe" }
]);
