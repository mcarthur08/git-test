// The walk-around scenes: what each is called, which stop of the journey opens it, the parts of its story with the
// Scripture shown in each, and the buttons that let someone take part. This is only the description (no drawing engine),
// so the map can read it cheaply; the scene itself is loaded when it is opened (see views/play/loaders.js).
import { PHASES as CANA_PHASES, STORY as CANA_STORY } from "../cana/story.js";
import { PARTS as BETHSAIDA_PARTS, STORY as BETHSAIDA_STORY } from "../bethsaida/story.js";
import { PARTS as GALILEE_PARTS, STORY as GALILEE_STORY } from "../galilee/story.js";
import { PARTS as JERICHO_PARTS, STORY as JERICHO_STORY } from "../jericho/story.js";
import { PARTS as CAPERNAUM_PARTS, STORY as CAPERNAUM_STORY } from "../capernaum/story.js";

export const SCENES = {
  cana: {
    id: "cana",
    title: "The wedding at Cana",
    ref: "John 2:1–11",
    stop: "Cana",
    enter: "Step into the wedding",
    parts: CANA_PHASES,
    steps: {
      feast: "The wedding feast",
      wineRuns: "The wine runs out",
      fillJars: "Fill the waterpots",
      drawOut: "Draw out and taste",
      celebrate: "The good wine"
    },
    story: CANA_STORY,
    hint: "Tap the floor to walk, a guest to say hello, or a water pot to help.",
    // each button calls the scene's method of this name
    actions: [
      { label: "Fill a pot", run: "helpWithJars" },
      { label: "Say hello", run: "greetNearest" },
      { label: "Dance", run: "dance" },
      { label: "Share a cup", run: "offerCup" }
    ]
  },
  bethsaida: {
    id: "bethsaida",
    title: "Feeding the five thousand",
    ref: "Luke 9:10–17",
    stop: "Bethsaida",
    enter: "Step onto the hillside",
    parts: BETHSAIDA_PARTS,
    steps: {
      day: "A long day",
      give: "Five loaves and two fishes",
      sit: "Sit down in companies",
      bless: "He gave thanks",
      feed: "All were filled",
      gather: "Twelve baskets"
    },
    story: BETHSAIDA_STORY,
    hint: "Tap the grass to walk, a person to say hello, or a basket to help.",
    actions: [
      { label: "Sit down", run: "sitDown" },
      { label: "Pass the bread", run: "passBread" },
      { label: "Gather a basket", run: "gatherBasket" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  galilee: {
    id: "galilee",
    title: "Peace, be still",
    ref: "Mark 4:35–41",
    stop: "Sea of Galilee",
    enter: "Step into the boat",
    parts: GALILEE_PARTS,
    steps: {
      evening: "Let us pass over",
      storm: "A great storm",
      fear: "Carest thou not?",
      calm: "Peace, be still",
      marvel: "What manner of man"
    },
    story: GALILEE_STORY,
    hint: "Tap the deck to walk, a person to say hello, or the water to bail it out.",
    actions: [
      { label: "Bail water", run: "bail" },
      { label: "Wake him", run: "wakeHim" },
      { label: "Hold on", run: "holdOn" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  jericho: {
    id: "jericho",
    title: "Zacchaeus in the sycamore",
    ref: "Luke 19:1–10",
    stop: "Jericho",
    enter: "Step into the street",
    parts: JERICHO_PARTS,
    steps: {
      street: "Jesus passes through Jericho",
      press: "Little of stature",
      climb: "Up into the sycomore",
      called: "Make haste, and come down",
      murmur: "They all murmured",
      restore: "Half my goods"
    },
    story: JERICHO_STORY,
    hint: "Tap the road to walk, a person to say hello, or the sycamore to climb it.",
    actions: [
      { label: "Climb the tree", run: "climbTree" },
      { label: "Give to the poor", run: "giveCoin" },
      { label: "Welcome him", run: "welcome" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  capernaum: {
    id: "capernaum",
    title: "Fishers of men",
    ref: "Matthew 4:18–22",
    stop: "Capernaum",
    enter: "Step onto the shore",
    parts: CAPERNAUM_PARTS,
    steps: {
      shore: "Casting a net",
      call: "Follow me",
      boat: "Mending their nets",
      leave: "They followed him"
    },
    story: CAPERNAUM_STORY,
    hint: "Tap the shallows to cast a net, a person to say hello, or the boat to mend a net.",
    actions: [
      { label: "Cast the net", run: "castNet" },
      { label: "Mend a net", run: "mendNet" },
      { label: "Follow him", run: "follow" },
      { label: "Say hello", run: "greetNearest" }
    ]
  }
};

// the scene that belongs to a stop of the journey (by the stop's `scene` id), or null
export const sceneOf = stop => (stop && stop.scene && SCENES[stop.scene]) || null;

// the words shown for a part of a scene, straight from its verses
export const partText = (scene, part) => SCENES[scene].story[part].quotes.map(q => q[1]).join(" ");
