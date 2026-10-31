// Thou art the Christ (Matthew 16:13–20) as five parts that run one after another, with the words of Scripture shown in
// each. The director is an XState machine, so it can be run and tested without a screen. Jesus is never drawn: he is a soft
// light that walks among his disciples at the foot of the cliffs, and the story is told in the words of the passage.
import { makeDirector } from "../play/director.js";

export const PARTS = ["ask", "say", "confess", "rock", "keys"];

// How long each part lasts if nothing speeds it up (the last one stays).
export const MS = { ask: 10000, say: 11000, confess: 12000, rock: 13000 };

// KJV text, checked against the Bible text the app ships (see the tests).
export const STORY = {
  ask: {
    ref: "Matthew 16:13",
    quotes: [
      [
        "Matthew 16:13",
        "When Jesus came into the coasts of Caesarea Philippi, he asked his disciples, saying, Whom do men say that I the Son of man am?"
      ]
    ]
  },
  say: {
    ref: "Matthew 16:14",
    quotes: [
      [
        "Matthew 16:14",
        "And they said, Some say that thou art John the Baptist: some, Elias; and others, Jeremias, or one of the prophets."
      ]
    ]
  },
  confess: {
    ref: "Matthew 16:15–16",
    quotes: [
      ["Matthew 16:15", "He saith unto them, But whom say ye that I am?"],
      [
        "Matthew 16:16",
        "And Simon Peter answered and said, Thou art the Christ, the Son of the living God."
      ]
    ]
  },
  rock: {
    ref: "Matthew 16:17–18",
    quotes: [
      [
        "Matthew 16:17",
        "And Jesus answered and said unto him, Blessed art thou, Simon Barjona: for flesh and blood hath not revealed it unto thee, but my Father which is in heaven."
      ],
      [
        "Matthew 16:18",
        "And I say also unto thee, That thou art Peter, and upon this rock I will build my church; and the gates of hell shall not prevail against it."
      ]
    ]
  },
  keys: {
    ref: "Matthew 16:19–20",
    quotes: [
      [
        "Matthew 16:19",
        "And I will give unto thee the keys of the kingdom of heaven: and whatsoever thou shalt bind on earth shall be bound in heaven: and whatsoever thou shalt loose on earth shall be loosed in heaven."
      ],
      [
        "Matthew 16:20",
        "Then charged he his disciples that they should tell no man that he was Jesus the Christ."
      ]
    ]
  }
};

// ask → say → confess → rock → keys. The last stays while the disciples stand with Peter and the keys.
export const directorMachine = makeDirector([
  { id: "ask", ms: MS.ask },
  { id: "say", ms: MS.say },
  { id: "confess", ms: MS.confess },
  { id: "rock", ms: MS.rock },
  { id: "keys" }
]);
