// The walk-around scenes: what each is called, which stop of the journey opens it, the parts of its story with the
// Scripture shown in each, and the buttons that let someone take part. This is only the description (no drawing engine),
// so the map can read it cheaply; the scene itself is loaded when it is opened (see views/play/loaders.js).
import { PHASES as CANA_PHASES, STORY as CANA_STORY } from "../cana/story.js";
import { PARTS as BETHSAIDA_PARTS, STORY as BETHSAIDA_STORY } from "../bethsaida/story.js";
import { PARTS as GALILEE_PARTS, STORY as GALILEE_STORY } from "../galilee/story.js";
import { PARTS as JERICHO_PARTS, STORY as JERICHO_STORY } from "../jericho/story.js";
import { PARTS as CAPERNAUM_PARTS, STORY as CAPERNAUM_STORY } from "../capernaum/story.js";
import { PARTS as BETHLEHEM_PARTS, STORY as BETHLEHEM_STORY } from "../bethlehem/story.js";
import { PARTS as NAZARETH_PARTS, STORY as NAZARETH_STORY } from "../nazareth/story.js";
import { PARTS as JORDAN_PARTS, STORY as JORDAN_STORY } from "../jordan/story.js";
import { PARTS as WILDERNESS_PARTS, STORY as WILDERNESS_STORY } from "../wilderness/story.js";
import { PARTS as CAESAREA_PARTS, STORY as CAESAREA_STORY } from "../caesarea/story.js";
import { PARTS as SAMARIA_PARTS, STORY as SAMARIA_STORY } from "../samaria/story.js";
import { PARTS as BETHANY_PARTS, STORY as BETHANY_STORY } from "../bethany/story.js";
import { PARTS as JERUSALEM_PARTS, STORY as JERUSALEM_STORY } from "../jerusalem/story.js";

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
  },
  bethlehem: {
    id: "bethlehem",
    title: "Born in Bethlehem",
    ref: "Luke 2:8–20",
    stop: "Bethlehem",
    enter: "Step into the field",
    parts: BETHLEHEM_PARTS,
    steps: {
      field: "Keeping watch by night",
      angel: "Fear not",
      host: "Glory to God in the highest",
      haste: "They came with haste",
      return: "Glorifying and praising God"
    },
    story: BETHLEHEM_STORY,
    hint: "Tap the grass to walk, a person to say hello, a sheep to gather it, or the stable to see the child.",
    actions: [
      { label: "Gather a sheep", run: "gatherSheep" },
      { label: "Sing praise", run: "sing" },
      { label: "Go to the manger", run: "visit" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  nazareth: {
    id: "nazareth",
    title: "Growing up in Nazareth",
    ref: "Luke 2:39–52",
    stop: "Nazareth",
    enter: "Step into the village",
    parts: NAZARETH_PARTS,
    steps: {
      home: "The child grew",
      feast: "Up to the feast",
      lost: "Tarried behind",
      found: "In the temple",
      grow: "Subject unto them"
    },
    story: NAZARETH_STORY,
    hint: "Tap the ground to walk, a person to say hello, the workshop to plane a board, or the house to pack for the feast.",
    actions: [
      { label: "Plane a board", run: "planeBoard" },
      { label: "Pack a bundle", run: "packBundle" },
      { label: "Look for him", run: "seek" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  jordan: {
    id: "jordan",
    title: "Baptized in the Jordan",
    ref: "Matthew 3:13–17",
    stop: "River Jordan",
    enter: "Step down to the river",
    parts: JORDAN_PARTS,
    steps: {
      come: "Cometh Jesus to Jordan",
      forbid: "Suffer it to be so now",
      baptized: "Up out of the water",
      opened: "The heavens opened",
      voice: "A voice from heaven"
    },
    story: JORDAN_STORY,
    hint: "Tap the shallows to wade in, or a person to say hello.",
    actions: [
      { label: "Wade in", run: "wade" },
      { label: "Listen to John", run: "listen" },
      { label: "Look up", run: "lookUp" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  wilderness: {
    id: "wilderness",
    title: "Tempted in the wilderness",
    ref: "Matthew 4:1–11",
    stop: "The Wilderness",
    enter: "Step into the wilderness",
    parts: WILDERNESS_PARTS,
    steps: {
      fast: "Forty days and forty nights",
      stones: "Stones made bread",
      pinnacle: "A pinnacle of the temple",
      mountain: "All the kingdoms",
      angels: "Angels ministered"
    },
    story: WILDERNESS_STORY,
    hint: "Tap the sand to walk, a person to say hello, a stone to gather it, or a flat rock to pray.",
    actions: [
      { label: "Gather a stone", run: "gatherStone" },
      { label: "Pray", run: "pray" },
      { label: "It is written", run: "itIsWritten" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  caesarea: {
    id: "caesarea",
    title: "Thou art the Christ",
    ref: "Matthew 16:13–20",
    stop: "Caesarea Philippi",
    enter: "Step to the foot of the cliffs",
    parts: CAESAREA_PARTS,
    steps: {
      ask: "Whom do men say?",
      say: "Some say John the Baptist",
      confess: "Thou art the Christ",
      rock: "Upon this rock",
      keys: "The keys of the kingdom"
    },
    story: CAESAREA_STORY,
    hint: "Tap the spring to drink, a person to say hello, or the great rock to lay a stone.",
    actions: [
      { label: "Drink at the spring", run: "drinkSpring" },
      { label: "Lay a stone", run: "layStone" },
      { label: "Say who he is", run: "confess" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  samaria: {
    id: "samaria",
    title: "Living water",
    ref: "John 4:5–30",
    stop: "Samaria",
    enter: "Step up to the well",
    parts: SAMARIA_PARTS,
    steps: {
      road: "He must needs go through Samaria",
      well: "Give me to drink",
      living: "Living water",
      tell: "Come, see a man",
      believe: "They came unto him"
    },
    story: SAMARIA_STORY,
    hint: "Tap the ground to walk, a person to say hello, or the well to draw water.",
    actions: [
      { label: "Draw water", run: "drawWater" },
      { label: "Give a drink", run: "giveDrink" },
      { label: "Go and tell", run: "goTell" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  bethany: {
    id: "bethany",
    title: "Six days before the passover",
    ref: "John 11–12",
    stop: "Bethany",
    enter: "Step into Bethany",
    parts: BETHANY_PARTS,
    steps: {
      grave: "Jesus wept",
      stone: "Take ye away the stone",
      forth: "Lazarus, come forth",
      supper: "They made him a supper",
      anoint: "The odour of the ointment"
    },
    story: BETHANY_STORY,
    hint: "Tap the rock to roll the stone, a person to say hello, or the table to pour out ointment.",
    actions: [
      { label: "Roll the stone", run: "rollStone" },
      { label: "Loose him", run: "looseHim" },
      { label: "Pour ointment", run: "pourOintment" },
      { label: "Say hello", run: "greetNearest" }
    ]
  },
  jerusalem: {
    id: "jerusalem",
    title: "The Passover",
    ref: "Luke 22:7–20",
    stop: "Jerusalem",
    enter: "Step into the upper room",
    parts: JERUSALEM_PARTS,
    steps: {
      prepare: "A large upper room",
      gather: "The hour was come",
      cup: "Take this, and divide it",
      bread: "This is my body",
      supper: "The new testament"
    },
    story: JERUSALEM_STORY,
    hint: "Tap the floor to walk, a person to say hello, or the table to lay a place or share the cup and bread.",
    actions: [
      { label: "Set the table", run: "setTable" },
      { label: "Pass the cup", run: "passCup" },
      { label: "Pass the bread", run: "passBread" },
      { label: "Say hello", run: "greetNearest" }
    ]
  }
};

// the scene that belongs to a stop of the journey (by the stop's `scene` id), or null
export const sceneOf = stop => (stop && stop.scene && SCENES[stop.scene]) || null;

// the words shown for a part of a scene, straight from its verses
export const partText = (scene, part) => SCENES[scene].story[part].quotes.map(q => q[1]).join(" ");
