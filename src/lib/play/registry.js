// The walk-around scenes: what each is called, which stop of the journey opens it, the parts of its story with the
// Scripture shown in each, and the buttons that let someone take part. This is only the description (no drawing engine),
// so the map can read it cheaply; the scene itself is loaded when it is opened (see views/play/loaders.js).
import { PHASES as CANA_PHASES, STORY as CANA_STORY } from "../cana/story.js";
import { PARTS as BETHSAIDA_PARTS, STORY as BETHSAIDA_STORY } from "../bethsaida/story.js";

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
  }
};

// the scene that belongs to a stop of the journey (by the stop's `scene` id), or null
export const sceneOf = stop => (stop && stop.scene && SCENES[stop.scene]) || null;

// the words shown for a part of a scene, straight from its verses
export const partText = (scene, part) => SCENES[scene].story[part].quotes.map(q => q[1]).join(" ");
