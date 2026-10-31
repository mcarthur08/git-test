// Static data: the Bible plan, Victory Moments, avatar parts, journey stops, releases and the guide.

/* ---------- Bible data ---------- */
export const BOOKS = [
  ["Matthew", 28, "g", "Mt"],
  ["Mark", 16, "g", "Mk"],
  ["Luke", 24, "g", "Lk"],
  ["John", 21, "g", "Jn"],
  ["Acts", 28, "a", "Acts"],
  ["Romans", 16, "p", "Rom"],
  ["1 Corinthians", 16, "p", "1Co"],
  ["2 Corinthians", 13, "p", "2Co"],
  ["Galatians", 6, "p", "Gal"],
  ["Ephesians", 6, "p", "Eph"],
  ["Philippians", 4, "p", "Php"],
  ["Colossians", 4, "p", "Col"],
  ["1 Thessalonians", 5, "p", "1Th"],
  ["2 Thessalonians", 3, "p", "2Th"],
  ["1 Timothy", 6, "p", "1Ti"],
  ["2 Timothy", 4, "p", "2Ti"],
  ["Titus", 3, "p", "Tit"],
  ["Philemon", 1, "p", "Phm"],
  ["Hebrews", 13, "l", "Heb"],
  ["James", 5, "l", "Jas"],
  ["1 Peter", 5, "l", "1Pe"],
  ["2 Peter", 3, "l", "2Pe"],
  ["1 John", 5, "l", "1Jn"],
  ["2 John", 1, "l", "2Jn"],
  ["3 John", 1, "l", "3Jn"],
  ["Jude", 1, "l", "Jude"],
  ["Revelation", 22, "r", "Rev"]
];

export const SECTIONS = {
  g: "Gospels",
  a: "Acts",
  p: "Paul's letters",
  l: "Hebrews & general letters",
  r: "Revelation"
};
export const CHAPTERS = [];
BOOKS.forEach(([b, n, s, ab]) => {
  for (let c = 1; c <= n; c++) {
    CHAPTERS.push({ b, c, s, ab, one: n === 1 });
  }
});
export const DAYS = 70;
export const TOTAL = CHAPTERS.length; // 260 chapters

export function groupChapters(ch) {
  const g = [];
  ch.forEach(x => {
    const last = g[g.length - 1];
    if (last && last.b === x.b) {
      last.z = x.c;
    } else {
      g.push({ b: x.b, ab: x.ab, a: x.c, z: x.c, one: x.one });
    }
  });
  return g;
}

export const fmtLong = g =>
  g.map(x => (x.one ? x.b : x.a === x.z ? `${x.b} ${x.a}` : `${x.b} ${x.a}–${x.z}`)).join("; ");
export const fmtShort = g =>
  g.map(x => (x.one ? x.ab : x.a === x.z ? `${x.ab} ${x.a}` : `${x.ab} ${x.a}–${x.z}`)).join(", ");

export const PLAN = [];
for (let d = 1; d <= DAYS; d++) {
  const from = Math.round((TOTAL * (d - 1)) / DAYS);
  const to = Math.round((TOTAL * d) / DAYS);
  const ch = CHAPTERS.slice(from, to);
  const g = groupChapters(ch);
  PLAN.push({
    day: d,
    from,
    to,
    count: ch.length,
    sec: ch[0].s,
    label: fmtLong(g),
    short: fmtShort(g)
  });
}

/* ---------- Victory Moments: one per week ---------- */
export const VICTORIES = [
  {
    day: 7,
    title: "Trapped at the Red Sea",
    ref: "Exodus 14",
    story:
      "Pharaoh's chariots were behind them and the sea was in front of them. Israel panicked. Moses told them to fear not and stand still, God parted the sea, and the whole nation walked through on dry ground.",
    verse: "The LORD shall fight for you, and ye shall hold your peace.",
    verseRef: "Exodus 14:14",
    nt: '"By faith they passed through the Red sea as by dry land." (Hebrews 11:29)',
    q: 'What feels like "army behind, sea in front" for you right now? What would trusting God look like there?'
  },
  {
    day: 14,
    title: "Hands Held High",
    ref: "Exodus 17:8–16",
    story:
      'Amalek attacked. While Moses held up his hands, Israel prevailed. When his hands grew heavy, Aaron and Hur sat him on a stone and held his hands up until sunset, and Joshua won the battle. Moses named the altar Jehovahnissi, which means "the LORD is my banner."',
    verse: "And Moses built an altar, and called the name of it Jehovahnissi.",
    verseRef: "Exodus 17:15",
    nt: '"Bear ye one another\'s burdens, and so fulfil the law of Christ." (Galatians 6:2)',
    q: 'Who in this group could you "hold up" this week? Who holds you up?'
  },
  {
    day: 21,
    title: "The Walls of Jericho",
    ref: "Joshua 6",
    story:
      "God's battle plan made no sense: march around the city once a day for six days, seven times on the seventh, then shout. Israel obeyed one day at a time, and the walls fell down flat.",
    verse:
      "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    verseRef: "Joshua 1:9",
    nt: '"By faith the walls of Jericho fell down, after they were compassed about seven days." (Hebrews 11:30)',
    q: "Jericho was won by showing up every day. What has three weeks of daily reading changed for you?"
  },
  {
    day: 28,
    title: "Gideon's 300",
    ref: "Judges 6–7",
    story:
      "Gideon was threshing wheat in hiding when the angel of the LORD called him a mighty man of valour. God cut his army from 32,000 to 300 so nobody could boast. With trumpets, pitchers and lamps, they watched the enemy run.",
    verse: "The LORD is with thee, thou mighty man of valour.",
    verseRef: "Judges 6:12",
    nt: '"My grace is sufficient for thee: for my strength is made perfect in weakness." (2 Corinthians 12:9)',
    q: "Where do you feel small or outnumbered? How could God use exactly that?"
  },
  {
    day: 35,
    title: "David and Goliath",
    ref: "1 Samuel 17",
    story:
      "For forty days a giant defied Israel and every soldier was afraid. A shepherd boy remembered how God had delivered him from a lion and a bear, chose five smooth stones, and ran out to meet him.",
    verse: "For the battle is the LORD's, and he will give you into our hands.",
    verseRef: "1 Samuel 17:47",
    nt: '"Greater is he that is in you, than he that is in the world." (1 John 4:4)',
    q: 'You\'re halfway. What "giant" are you facing, and what past "lions and bears" remind you God is faithful?'
  },
  {
    day: 42,
    title: "The Singers Went First",
    ref: "2 Chronicles 20",
    story:
      'Three armies marched against King Jehoshaphat. He prayed, "Neither know we what to do: but our eyes are upon thee." He sent singers out in front of the army, and God turned the enemies against each other.',
    verse:
      "Be not afraid nor dismayed by reason of this great multitude; for the battle is not yours, but God's.",
    verseRef: "2 Chronicles 20:15",
    nt: '"If God be for us, who can be against us?" (Romans 8:31)',
    q: "How could praise change the way you walk into a hard week?"
  },
  {
    day: 49,
    title: "Fire on Mount Carmel",
    ref: "1 Kings 18",
    story:
      "Elijah stood alone against 450 prophets of Baal. They cried out all day and nothing happened. Elijah drenched his altar with water, prayed a short prayer, and the fire of the LORD fell.",
    verse: "How long halt ye between two opinions? if the LORD be God, follow him.",
    verseRef: "1 Kings 18:21",
    nt: '"Elias was a man subject to like passions as we are, and he prayed earnestly." (James 5:17)',
    q: "Where are you tempted to sit on the fence? What would choosing fully look like?"
  },
  {
    day: 56,
    title: "A Letter Laid Before God",
    ref: "2 Kings 19",
    story:
      "The king of Assyria sent Hezekiah a letter full of threats. Hezekiah went up to the house of the LORD, spread it before the LORD and prayed. That night the Assyrian army was struck down and the king went home.",
    verse:
      "That all the kingdoms of the earth may know that thou art the LORD God, even thou only.",
    verseRef: "2 Kings 19:19",
    nt: '"Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God." (Philippians 4:6)',
    q: 'What message, worry or pressure could you "spread before the LORD" today?'
  },
  {
    day: 63,
    title: "Rebuilding the Wall",
    ref: "Nehemiah 4 & 6",
    story:
      "Enemies mocked and threatened the builders of Jerusalem's wall. They worked with one hand and held a weapon in the other, prayed, and finished the whole wall in just 52 days.",
    verse: "Be not ye afraid of them: remember the Lord, which is great and terrible.",
    verseRef: "Nehemiah 4:14",
    nt: '"And let us not be weary in well doing: for in due season we shall reap, if we faint not." (Galatians 6:9)',
    q: "You've already outlasted the 52-day wall. What keeps you going when you're tired or teased?"
  },
  {
    day: 70,
    title: "Not Even the Smell of Fire",
    ref: "Daniel 3",
    story:
      "Shadrach, Meshach and Abednego refused to bow to the king's golden image, even facing a burning fiery furnace. A fourth man walked with them in the fire, and they came out without even the smell of fire on them.",
    verse: "Our God whom we serve is able to deliver us… But if not… we will not serve thy gods.",
    verseRef: "Daniel 3:17–18",
    nt: '"But thanks be to God, which giveth us the victory through our Lord Jesus Christ." (1 Corinthians 15:57)',
    q: "You finished the New Testament. What will you keep standing for after these 70 days?"
  }
];

/* ---------- Avatar parts ---------- */
export const SKINS = ["#F0D2B4", "#E0B189", "#C8935F", "#AB7547", "#875733", "#5B3A21"];
export const HAIRC = ["#16110D", "#2C1F17", "#463021", "#684730", "#8B6943", "#8E8983"];
export const HAIRS = [
  ["Short", "short"],
  ["Long", "long"],
  ["Bun", "bun"],
  ["Curly", "curly"],
  ["Braids", "braids"],
  ["Close-cropped", "crop"]
];

// face geometry: forehead, cheek and jaw half-widths, chin y, chin half-width
export const FACES = [
  ["Round", [31, 35, 27, 131, 12]],
  ["Oval", [29, 32, 22, 135, 9]],
  ["Square", [31, 33, 30, 133, 16]],
  ["Heart", [34, 33, 19, 135, 6]],
  ["Long", [28, 29, 22, 141, 9]]
];

export const EYES = [
  ["Almond", "almond"],
  ["Round", "round"],
  ["Deep-set", "deep"],
  ["Hooded", "hooded"],
  ["Upturned", "up"]
];

export const EYEC = ["#3B2414", "#1C1410", "#6B4A26", "#5C7032", "#4E6F96", "#7A6F62"];
// brows: peak lift, thickness, angular
export const BROWS = [
  ["Natural arch", -4, 3.1, false],
  ["Straight", -1.4, 3, false],
  ["Thick", -3, 4.5, false],
  ["Fine", -3.6, 1.9, false],
  ["Angled", -5.2, 3, true]
];

export const MOUTHS = [
  ["Soft smile", "soft"],
  ["Warm smile", "warm"],
  ["Smirk", "smirk"],
  ["Neutral", "neutral"],
  ["Laugh", "laugh"],
  ["Parted", "parted"]
];

export const BEARDS = [
  ["Clean-shaven", "none"],
  ["Stubble", "stubble"],
  ["Trimmed", "trim"],
  ["Full", "full"],
  ["Long", "long"]
];

export const COVERS = {
  m: [
    ["Bare head", "none"],
    ["Headcloth", "cloth"],
    ["Turban", "turban"]
  ],
  f: [
    ["Uncovered", "none"],
    ["Veil", "veil"],
    ["Coin headdress", "coins"],
    ["Headscarf", "scarf"]
  ]
};
// outer garment: men's mantle (simlah), women's shawl and veil. [label, color, stripe or embroidery color]
export const MANTLES = {
  m: [
    ["Striped wool", "#D3C3A0", "#5E4430"],
    ["Brown wool", "#6B4E36", ""],
    ["Charcoal wool", "#38322C", ""],
    ["Natural wool", "#B9A784", ""],
    ["Black-striped", "#E2D8C2", "#25201B"]
  ],
  f: [
    ["Indigo", "#2D3D69", ""],
    ["Madder red", "#873328", ""],
    ["Saffron", "#B9852A", ""],
    ["Linen", "#E1D6BF", ""],
    ["Embroidered plum", "#4B2C45", "#C9A04B"]
  ]
};
export const JEWELS = [
  ["None", "none"],
  ["Gold earrings", "ear"],
  ["Earrings & beads", "beads"],
  ["Nose ring", "nose"]
];

// [label, value, days needed, who] who: "m" men, "f" women, "" everyone
export const UNLOCK = {
  tunic: [
    ["Undyed wool", "#C6B392", 0, "m"],
    ["Earth brown", "#77583B", 0, "m"],
    ["Charcoal", "#38332E", 0, "m"],
    ["Indigo", "#33457A", 0, "f"],
    ["Madder red", "#8C392D", 0, "f"],
    ["Saffron", "#BE8E2E", 0, "f"],
    ["Linen", "#DCD1B7", 0, ""],
    ["Olive", "#66673A", 0, ""],
    ["Scarlet", "#9A2A22", 3, ""],
    ["Lydia's purple", "#5C2A53", 12, ""],
    ["Galilee blue", "#2E5C70", 18, ""],
    ["Gold-trimmed", "#AD8638", 25, ""],
    ["Midnight", "#1D2232", 33, ""],
    ["White robe", "#ECE6D8", 45, ""]
  ],
  sash: [
    ["Leather", "#4E3320", 0, ""],
    ["Rope", "#A88E62", 0, ""],
    ["Red", "#962F28", 6, ""],
    ["Royal blue", "#2B4C8C", 15, ""],
    ["Belt of truth", "#D2A546", 30, ""]
  ],
  hat: [
    ["None", "none", 0, ""],
    ["Headband", "band", 0, ""],
    ["Linen wrap", "wrap", 5, ""],
    ["Laurel", "laurel", 28, ""],
    ["Helmet of salvation", "helmet", 50, ""],
    ["Crown of life", "crown", 70, ""]
  ],
  item: [
    ["None", "none", 0, ""],
    ["Shepherd's staff", "staff", 3, ""],
    ["Scroll", "scroll", 8, ""],
    ["Sling", "sling", 14, ""],
    ["Shofar", "shofar", 21, ""],
    ["Lamp", "lamp", 35, ""],
    ["Shield of faith", "shield", 42, ""],
    ["Sword of the Spirit", "sword", 56, ""],
    ["Harp", "harp", 11, ""],
    ["Builder's hammer", "hammer", 24, ""],
    ["Spear", "spear", 49, ""],
    ["Fishing net", "net", 5, ""],
    ["Tent cloth", "cloth", 30, ""],
    ["Saw", "saw", 35, ""],
    ["Sickle", "sickle", 17, ""],
    ["Coin purse", "purse", 40, ""],
    ["Censer", "censer", 63, ""],
    ["Timbrel", "timbrel", 22, ""],
    ["Infant in swaddling cloth", "infant", 26, "f"],
    ["Water basin", "basin", 19, "f"],
    ["Water jar", "jar", 10, ""],
    ["Merchant's scales", "scales", 33, ""],
    ["Spindle", "spindle", 13, "f"],
    ["Sheaf of grain", "sheaf", 8, ""],
    ["Bethlehem star", "star", 0, ""],
    ["Carpenter's square", "square", 6, ""],
    ["Dove", "dove", 12, ""],
    ["Wilderness stone", "stone", 18, ""],
    ["Cup of new wine", "cup", 24, ""],
    ["Catch of fish", "fish", 30, ""],
    ["Oar", "oar", 36, ""],
    ["Basket of loaves", "loaves", 42, ""],
    ["Keys of the kingdom", "keys", 48, ""],
    ["Well bucket", "bucket", 54, ""],
    ["Sycamore branch", "sycamore", 60, ""],
    ["Alabaster jar", "alabaster", 65, ""],
    ["Palm branch", "palm", 70, ""]
  ]
};
export const UNLOCK_NAMES = { tunic: "robe", sash: "girdle", hat: "headgear", item: "item" };
export const allowedFor = (key, g) =>
  UNLOCK[key].map((e, i) => [e, i]).filter(([e]) => !e[3] || e[3] === g);

// prettier-ignore
export const NAMES_M = [
  "Gideon", "Caleb", "Boaz", "Barnabas", "Silas", "Timothy", "Elijah", "Elisha", "Josiah",
  "Nehemiah", "Obadiah", "Jonah", "Ezra", "Hezekiah", "Jabez", "Enoch", "Joel", "Amos", "Micah",
  "Titus", "Apollos", "Stephen", "Levi", "Zacchaeus", "Jethro", "Hosea", "Samson", "Nathan",
  "Asa", "Jonathan", "Uriah", "Zerubbabel"
];

// prettier-ignore
export const NAMES_F = [
  "Ruth", "Esther", "Deborah", "Hannah", "Miriam", "Naomi", "Lydia", "Priscilla", "Phoebe",
  "Dorcas", "Rahab", "Abigail", "Martha", "Elizabeth", "Anna", "Eunice", "Lois", "Rhoda",
  "Junia", "Sarah", "Rebekah", "Rachel", "Leah", "Jochebed", "Zipporah", "Damaris", "Joanna",
  "Susanna", "Tabitha", "Huldah", "Jael", "Keturah"
];

// prettier-ignore
export const PLACES = [
  "", "of Bethel", "of Bethlehem", "of Nazareth", "of Galilee", "of Jericho", "of Hebron",
  "of Zion", "of Shiloh", "of Bethany", "of Capernaum", "of Emmaus", "of Joppa", "of Tarsus",
  "of Antioch", "of Philippi", "of Corinth", "of Ephesus", "of Patmos", "of Berea"
];

export const VERSIONS = ["KJV"];
export const DEFAULT_TEAMS = [
  "Tribe of Judah",
  "Tribe of Benjamin",
  "Tribe of Levi",
  "Tribe of Ephraim"
];

export const TEAM_COLORS = ["var(--gold)", "var(--sky)", "var(--rose)", "var(--teal)"];
export const TEAM_ICONS = ["lion", "wolf", "breastplate", "ox"];
export const TEAM_VERSES = [
  ["Judah is a lion's whelp.", "Genesis 49:9"],
  ["Benjamin shall ravin as a wolf.", "Genesis 49:27"],
  ["Let thy Thummim and thy Urim be with thy holy one.", "Deuteronomy 33:8"],
  ["His glory is like the firstling of his bullock.", "Deuteronomy 33:17"]
];

export const DEFAULT_CONFIG = {
  start: "2026-10-22",
  groupName: "Youth Group",
  version: "KJV",
  teams: DEFAULT_TEAMS
};
export const TABS = [
  ["today", "Today", "Today"],
  ["journey", "Journey", "Journey"],
  ["plan", "Plan", "Plan"],
  ["group", "Group", "Group"],
  ["chat", "Chat", "Chat"],
  ["victories", "Victories", "Victories"],
  ["me", "Me", "Me"],
  ["leader", "Leader", "Leader"],
  ["read", "Read", "Read"],
  ["quiz", "Quiz", "Quiz"],
  ["help", "How it works", "Help"]
];

// The tab bar shows five; the Plan opens from Today, Leader tools from Me, and Chat and Help from the header.
export const NAV_TABS = ["today", "journey", "group", "victories", "me"];
export const CHAT_MAX = 500; // characters per chat message

export const CHEER_KINDS = { pray: "🙏", fire: "🔥" };
export const RD_SIZES = [0.95, 1.05, 1.15, 1.28, 1.42, 1.6];

/* ---------- Journey to the Passover ---------- */
// x/y are map coordinates (viewBox 360 x 560, north up). lx/ly/la place the label.
export const STOPS = [
  {
    day: 0,
    place: "Bethlehem",
    title: "Born in Bethlehem",
    scene: "bethlehem",
    keepsake: "star",
    ref: "Luke 2:1–20",
    x: 197,
    y: 457,
    lx: -9,
    ly: 4,
    la: "end",
    text: "Jesus' journey begins in the little town of Bethlehem, the city of David, where shepherds came to see the baby lying in a manger.",
    verse:
      "For unto you is born this day in the city of David a Saviour, which is Christ the Lord.",
    verseRef: "Luke 2:11"
  },
  {
    day: 6,
    place: "Nazareth",
    title: "Growing up in Nazareth",
    scene: "nazareth",
    keepsake: "square",
    ref: "Luke 2:39–52",
    x: 222,
    y: 198,
    lx: -9,
    ly: 4,
    la: "end",
    text: "Jesus grew up in Nazareth of Galilee. Every year his family walked to Jerusalem for the feast of the passover, and at twelve he amazed the teachers in the temple.",
    verse: "And Jesus increased in wisdom and stature, and in favour with God and man.",
    verseRef: "Luke 2:52"
  },
  {
    day: 12,
    place: "River Jordan",
    title: "Baptized in the Jordan",
    scene: "jordan",
    keepsake: "dove",
    ref: "Matthew 3:13–17",
    x: 271,
    y: 396,
    lx: 9,
    ly: 3,
    la: "start",
    text: "At Bethabara beyond Jordan, John baptized Jesus. The heavens opened, the Spirit came down like a dove, and the Father spoke from heaven.",
    verse: "This is my beloved Son, in whom I am well pleased.",
    verseRef: "Matthew 3:17"
  },
  {
    day: 18,
    place: "The Wilderness",
    title: "Tempted in the wilderness",
    scene: "wilderness",
    keepsake: "stone",
    ref: "Matthew 4:1–11",
    x: 240,
    y: 466,
    lx: 2,
    ly: 16,
    la: "middle",
    text: "For forty days Jesus fasted in the wilderness of Judaea. Every time the devil tempted him, Jesus answered with Scripture. That's why we read every day.",
    verse:
      "It is written, Man shall not live by bread alone, but by every word that proceedeth out of the mouth of God.",
    verseRef: "Matthew 4:4"
  },
  {
    day: 24,
    place: "Cana",
    title: "Water into wine",
    scene: "cana",
    keepsake: "cup",
    ref: "John 2:1–11",
    x: 229,
    y: 178,
    lx: -9,
    ly: 3,
    la: "end",
    text: "At a wedding in Cana, the wine ran out. Jesus told the servants to fill the waterpots, and the water became the best wine of the feast.",
    verse:
      "This beginning of miracles did Jesus in Cana of Galilee, and manifested forth his glory.",
    verseRef: "John 2:11"
  },
  {
    day: 30,
    place: "Capernaum",
    title: "Fishers of men",
    scene: "capernaum",
    keepsake: "fish",
    ref: "Matthew 4:13–22",
    x: 266,
    y: 150,
    lx: -9,
    ly: 2,
    la: "end",
    text: "Jesus made Capernaum his home by the sea. Walking the shore, he called Peter, Andrew, James and John to leave their nets and follow him.",
    verse: "Follow me, and I will make you fishers of men.",
    verseRef: "Matthew 4:19"
  },
  {
    day: 36,
    place: "Sea of Galilee",
    title: "Peace, be still",
    scene: "galilee",
    keepsake: "oar",
    ref: "Mark 4:35–41",
    x: 277,
    y: 176,
    lx: 0,
    ly: 0,
    la: "none",
    text: "A great storm hit the disciples' boat while Jesus slept. He stood up, rebuked the wind, and the sea became completely calm.",
    verse:
      "And he arose, and rebuked the wind, and said unto the sea, Peace, be still. And the wind ceased, and there was a great calm.",
    verseRef: "Mark 4:39"
  },
  {
    day: 42,
    place: "Bethsaida",
    title: "Feeding the five thousand",
    scene: "bethsaida",
    keepsake: "loaves",
    ref: "Luke 9:10–17",
    x: 289,
    y: 149,
    lx: 9,
    ly: 2,
    la: "start",
    text: "Near Bethsaida a hungry crowd of five thousand men followed Jesus. With five loaves and two fishes he fed them all, with twelve baskets left over.",
    verse: "I am the bread of life: he that cometh to me shall never hunger.",
    verseRef: "John 6:35"
  },
  {
    day: 48,
    place: "Caesarea Philippi",
    title: "Thou art the Christ",
    scene: "caesarea",
    keepsake: "keys",
    ref: "Matthew 16:13–20",
    x: 293,
    y: 64,
    lx: 0,
    ly: -10,
    la: "middle",
    text: 'Far in the north, Jesus asked his disciples, "Whom say ye that I am?" Peter answered with the truth the whole New Testament is about.',
    verse: "Thou art the Christ, the Son of the living God.",
    verseRef: "Matthew 16:16"
  },
  {
    day: 54,
    place: "Samaria",
    title: "Set his face to Jerusalem",
    scene: "samaria",
    keepsake: "bucket",
    ref: "Luke 9:51; John 4",
    x: 213,
    y: 316,
    lx: -9,
    ly: 4,
    la: "end",
    text: "Jesus turned south toward Jerusalem. In Samaria, at Jacob's well near Sychar, he offered a thirsty woman living water.",
    verse: "He stedfastly set his face to go to Jerusalem.",
    verseRef: "Luke 9:51"
  },
  {
    day: 60,
    place: "Jericho",
    title: "Zacchaeus and Bartimaeus",
    scene: "jericho",
    keepsake: "sycamore",
    ref: "Luke 19:1–10",
    x: 247,
    y: 416,
    lx: 4,
    ly: 15,
    la: "middle",
    text: "In Jericho, blind Bartimaeus received his sight, and a short tax collector named Zacchaeus climbed a sycomore tree and met Jesus.",
    verse: "For the Son of man is come to seek and to save that which was lost.",
    verseRef: "Luke 19:10"
  },
  {
    day: 65,
    place: "Bethany",
    title: "Six days before the passover",
    scene: "bethany",
    keepsake: "alabaster",
    ref: "John 11–12",
    x: 217,
    y: 426,
    lx: 2,
    ly: -9,
    la: "middle",
    text: "At Bethany Jesus raised Lazarus from the dead. Then, six days before the passover, Mary anointed his feet with costly ointment.",
    verse:
      "I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live.",
    verseRef: "John 11:25"
  },
  {
    day: 70,
    place: "Jerusalem",
    title: "The Passover",
    scene: "jerusalem",
    keepsake: "palm",
    ref: "Luke 22:7–20",
    x: 199,
    y: 431,
    lx: -10,
    ly: 4,
    la: "end",
    text: "You made it to Jerusalem for the Passover. Jesus shared the Passover meal with his disciples, gave his life on the cross, and rose again on the third day.",
    verse: "For even Christ our passover is sacrificed for us.",
    verseRef: "1 Corinthians 5:7"
  }
];

/* ---------- what's new ---------- */
// Newest first. Add an entry for every series of updates: bump the middle number for new
// features (1.2, 1.3…) and the last for bug fixes (1.2.1). The popup waits until `from`
// (local time), then shows once per device to anyone who hasn't seen that version.
export const RELEASES = [
  {
    v: "1.4",
    from: "2026-10-30T06:00",
    title: "A brighter look",
    items: [
      [
        "today",
        "Desert morning",
        "A lighter, warmer design with clearer lettering. Prefer the old look? Switch back under Me › Appearance."
      ],
      [
        "book",
        "A clean reading page",
        "The reader opens on a white page. Tap Sepia for a warmer one."
      ]
    ]
  },
  {
    v: "1.3",
    from: "2026-10-30T06:00",
    title: "Talk it over",
    items: [
      [
        "chat",
        "Group chat",
        "Tap the chat bubble at the top for questions and comments with the whole group. A number shows when there's something new."
      ],
      [
        "target",
        "Ask a question",
        "Tick This is a question and a leader can find it, answer it and mark it answered."
      ],
      ["pin", "Pinned notes", "Leaders can pin important messages to the top of the chat."],
      [
        "target",
        "A tougher quiz",
        "7 questions now: who said it, who did it, what happened, and which verses were in your reading."
      ],
      [
        "book",
        "Pick up where you left off",
        "The reader saves your place as you go, and you can tap any verse to bookmark it. Continue reading from Today, on any device."
      ],
      [
        "flag",
        "Keep it kind",
        "See something that isn't right? Tap Report and a leader will take a look."
      ]
    ]
  },
  {
    v: "1.2",
    from: "2026-10-24T06:00",
    title: "Easier every day",
    items: [
      [
        "today",
        "Daily reminder",
        "Add a reminder to Google Calendar, iPhone or Outlook at the time you choose. Find it under Me."
      ],
      ["me", "Help is one tap away", "Tap the ? at the top for how everything works."],
      [
        "group",
        "A kinder leaderboard",
        "Readers are grouped as Finished, On pace and Catching up, with a weekly highlight."
      ],
      ["book", "Easier to read", "Bigger text and buttons that are easier to tap."],
      ["star", "Quick start", "New friends can join in seconds with Surprise me."]
    ]
  },
  {
    v: "1.1",
    from: "2026-10-23T06:00",
    title: "Fresh on the road",
    items: [
      ["group", "Tribe rosters", "Tap a tribe on the Group tab to see who's in it."],
      [
        "target",
        "Daily quiz",
        "5 quick KJV questions after each reading. Perfect scores earn your tribe a point."
      ],
      ["flame", "Cheers", "Send a 🙏 or 🔥 to friends on the leaderboard."],
      ["victories", "Talk about it", "Share your thoughts under each Victory Moment."],
      [
        "book",
        "Read in the app",
        "Open each day's KJV chapters right here, with bigger text and a light mode."
      ],
      ["today", "Weekly recap", "Each week starts with a look back at how you and your tribe did."]
    ]
  },
  {
    v: "1.0",
    from: "2026-10-22T00:00",
    title: "The quest begins",
    items: [["journey", "NT70 Quest launched", "70 days, 260 chapters, Bethlehem to Jerusalem."]]
  }
];

/* ---------- How it works: shown once to new players, reopened from the ? in the header ---------- */
export const GUIDE = [
  [
    "today",
    "Each day",
    "Open <b>Today</b>, tap <b>Read Day X</b> (or use your own Bible), then check it off. About 4 chapters, 15–20 minutes."
  ],
  [
    "group",
    "Your tribe",
    "You're in one of four tribes. Tribes are ranked by average chapters plus perfect-quiz points, so every reader helps."
  ],
  [
    "flame",
    "Fell behind?",
    "No guilt. Today shows one clear next step. Read on paper? Use <b>Mark everything read through</b>. Finishing late still counts."
  ],
  [
    "victories",
    "Along the way",
    "Your character walks from Bethlehem to Jerusalem, and every 7 days unlocks a Victory Moment to talk about."
  ],
  [
    "me",
    "Something not working?",
    "Ask in the group chat (the bubble at the top) or message a youth leader. Closing and reopening the app fixes most things."
  ]
];

export const SIGNIN_CAST = [
  {
    g: "m",
    skin: 3,
    hair: 3,
    hairColor: 0,
    beard: 3,
    tunic: 1,
    mantle: 0,
    cover: 0,
    face: 2,
    eyes: 2,
    brows: 2,
    mouth: 1
  },
  {
    g: "f",
    skin: 1,
    hair: 1,
    hairColor: 2,
    tunic: 5,
    mantle: 0,
    cover: 1,
    face: 1,
    eyes: 0,
    brows: 0,
    mouth: 0,
    jewel: 1
  },
  {
    g: "m",
    skin: 2,
    hair: 0,
    hairColor: 1,
    beard: 4,
    tunic: 0,
    mantle: 4,
    cover: 1,
    face: 4,
    eyes: 3,
    brows: 1,
    mouth: 3,
    hat: 0
  },
  {
    g: "f",
    skin: 4,
    hair: 4,
    hairColor: 0,
    tunic: 4,
    mantle: 1,
    cover: 2,
    face: 3,
    eyes: 4,
    brows: 3,
    mouth: 1,
    jewel: 2
  },
  {
    g: "m",
    skin: 1,
    hair: 5,
    hairColor: 3,
    beard: 2,
    tunic: 2,
    mantle: 1,
    cover: 2,
    face: 0,
    eyes: 0,
    brows: 0,
    mouth: 0
  }
];
