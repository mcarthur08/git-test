// Daily quiz: 7 questions built from the day's KJV text: who said it, who did it, what happened,
// which verse was in the reading, and finish the verse.
import { PLAN, CHAPTERS } from "./data.js";

const esc = s =>
  String(s ?? "").replace(
    /[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

// Common words that make poor quiz answers.
// prettier-ignore
export const QUIZ_STOP = new Set(
  [
    "the and that unto them with they which shall have said this from were there their him his",
    "for not but all was are thou thee thy hath when then into upon what also her these those",
    "things came come went saith being even because should would could every before after again",
    "against among about through other more than many much whom whose where here now yet behold",
    "verily therefore wherefore according hast shalt doth didst wilt neither nor only some such",
    "same your ours been made make took take given give gave spake spoken until while shalt",
    "cometh goeth hearken answered answering certain great things thing whosoever whatsoever",
    "whilst thereof without within therein whereby wherein thereby thence hither thither",
    "likewise forthwith straightway began daily wrought though although howbeit insomuch",
    "nevertheless notwithstanding"
  ].join(" ").split(" ")
);

export const QUIZ_FALLBACK = [
  "mercy",
  "glory",
  "wisdom",
  "peace",
  "power",
  "light",
  "faith",
  "bread",
  "house",
  "heart",
  "spirit",
  "kingdom",
  "truth",
  "grace"
];

export const QUIZ_NAMES = [
  "Peter",
  "John",
  "James",
  "Paul",
  "Moses",
  "Abraham",
  "David",
  "Elias",
  "Pilate",
  "Herod",
  "Mary",
  "Martha",
  "Barnabas",
  "Timothy",
  "Israel",
  "Jerusalem",
  "Galilee",
  "Judaea",
  "Andrew",
  "Philip"
];

export const qCore = w => w.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
export const shuffle = a => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
export const pick = a => a[Math.floor(Math.random() * a.length)];
export function quizVerses(day, kjv) {
  const p = PLAN[day - 1];
  const out = [];
  CHAPTERS.slice(p.from, p.to).forEach(c =>
    (kjv[c.b][c.c - 1] || []).forEach((t, i) =>
      out.push({
        c,
        v: i + 1,
        t,
        ref: `${c.one ? c.b : `${c.b} ${c.c}`}:${i + 1}`,
        chap: c.one ? c.b : `${c.b} ${c.c}`
      })
    )
  );
  return out;
}

// Words worth asking about. Plain words: lowercase, 5+ letters, not filler, and not repeated elsewhere in the verse.
// Names: capitalized, never lowercase anywhere in the day's reading, and not just starting a sentence.
let QUIZ_LOWER = new Set();
// People, places and peoples of the New Testament (capitalized everywhere they appear in the KJV NT).
// prettier-ignore
export const NT_NAMES = new Set([
  "Aaron", "Abaddon", "Abel", "Abia", "Abiathar", "Abilene", "Abiud", "Abraham", "Aceldama",
  "Achaia", "Achaicus", "Achaz", "Achim", "Adam", "Addi", "Adramyttium", "Adria", "Aeneas",
  "Aenon", "Agabus", "Agar", "Agrippa", "Alexander", "Alexandria", "Alexandrians", "Alphaeus",
  "Aminadab", "Amon", "Amos", "Amphipolis", "Amplias", "Ananias", "Andrew", "Andronicus", "Anna",
  "Annas", "Antioch", "Antipas", "Antipatris", "Apelles", "Apollonia", "Apollos", "Apollyon",
  "Apphia", "Appii", "Aquila", "Arabia", "Arabians", "Aram", "Archelaus", "Archippus",
  "Areopagite", "Areopagus", "Aretas", "Arimathaea", "Aristarchus", "Aristobulus", "Armageddon",
  "Arphaxad", "Artemas", "Asa", "Aser", "Asia", "Assos", "Asyncritus", "Athenians", "Athens",
  "Attalia", "Augustus", "Azor", "Azotus", "Baal", "Babylon", "Balaam", "Balac", "Barabbas",
  "Barachias", "Barak", "Barjesus", "Barjona", "Barnabas", "Barsabas", "Bartholomew",
  "Bartimaeus", "Beelzebub", "Belial", "Benjamin", "Berea", "Bernice", "Bethabara", "Bethany",
  "Bethesda", "Bethlehem", "Bethphage", "Bethsaida", "Bithynia", "Blastus", "Boanerges", "Booz",
  "Bosor", "Caesar", "Caesarea", "Caiaphas", "Cain", "Cainan", "Calvary", "Cana", "Canaan",
  "Canaanite", "Candace", "Capernaum", "Cappadocia", "Carpus", "Castor", "Cedron", "Cenchrea",
  "Cephas", "Chaldaeans", "Chanaan", "Charran", "Chios", "Chloe", "Chorazin", "Christian",
  "Christians", "Chuza", "Cilicia", "Cis", "Clauda", "Claudia", "Claudius", "Clement", "Cleopas",
  "Cleophas", "Cnidus", "Colosse", "Coos", "Core", "Corinth", "Corinthians", "Cornelius",
  "Cosam", "Crete", "Cretians", "Crispus", "Cyprus", "Cyrene", "Cyrenian", "Cyrenians",
  "Cyrenius", "Dalmanutha", "Dalmatia", "Damaris", "Damascenes", "Damascus", "Daniel", "David",
  "Decapolis", "Demas", "Demetrius", "Derbe", "Diana", "Didymus", "Dionysius", "Diotrephes",
  "Dorcas", "Drusilla", "Egypt", "Egyptian", "Egyptians", "Elamites", "Eleazar", "Eli",
  "Eliakim", "Elias", "Eliezer", "Elisabeth", "Eliseus", "Eliud", "Elmodam", "Elymas",
  "Emmanuel", "Emmaus", "Emmor", "Enoch", "Enos", "Epaenetus", "Epaphras", "Epaphroditus",
  "Ephesian", "Ephesians", "Ephesus", "Ephraim", "Epicureans", "Erastus", "Esaias", "Esau",
  "Esli", "Esrom", "Ethiopia", "Ethiopians", "Eunice", "Euodias", "Euphrates", "Euroclydon",
  "Eutychus", "Eve", "Ezekias", "Felix", "Festus", "Fortunatus", "Gabbatha", "Gabriel", "Gad",
  "Gadarenes", "Gaius", "Galatia", "Galatians", "Galilaean", "Galilaeans", "Galilee", "Gallio",
  "Gamaliel", "Gaza", "Gedeon", "Gennesaret", "Gentile", "Gentiles", "Gergesenes", "Gethsemane",
  "Gog", "Golgotha", "Gomorrha", "Grecians", "Greece", "Greek", "Greeks", "Heber", "Hebrew",
  "Hebrews", "Heli", "Hermas", "Hermes", "Hermogenes", "Herod", "Herodians", "Herodias",
  "Herodion", "Hierapolis", "Hymenaeus", "Iconium", "Idumaea", "Illyricum", "Isaac", "Iscariot",
  "Israel", "Israelite", "Israelites", "Issachar", "Italian", "Italy", "Ituraea", "Jacob",
  "Jairus", "Jambres", "James", "Janna", "Jannes", "Jared", "Jason", "Jechonias", "Jephthae",
  "Jeremias", "Jeremy", "Jericho", "Jerusalem", "Jesse", "Jesus", "Jew", "Jewess", "Jewish",
  "Jewry", "Jews", "Jezebel", "Joanna", "Joatham", "Job", "Joel", "John", "Jona", "Jonan",
  "Jonas", "Joppa", "Joram", "Jordan", "Jorim", "Josaphat", "Jose", "Joseph", "Joses", "Josias",
  "Juda", "Judaea", "Judah", "Judas", "Julia", "Julius", "Junia", "Jupiter", "Justus", "Lamech",
  "Laodicea", "Laodiceans", "Lasea", "Latin", "Lazarus", "Lebbaeus", "Levi", "Levite", "Levites",
  "Levitical", "Libertines", "Libya", "Linus", "Lois", "Lucas", "Lucius", "Luke", "Lycaonia",
  "Lycia", "Lydda", "Lydia", "Lysanias", "Lysias", "Lystra", "Maath", "Macedonia", "Macedonian",
  "Madian", "Magdala", "Magdalene", "Magog", "Malchus", "Maleleel", "Manaen", "Manasses",
  "Marcus", "Mars", "Martha", "Mary", "Mathusala", "Mattatha", "Mattathias", "Matthan",
  "Matthat", "Matthew", "Matthias", "Medes", "Melchi", "Melchisedec", "Melea", "Melita", "Menan",
  "Mercurius", "Mesopotamia", "Messias", "Michael", "Miletum", "Miletus", "Mitylene", "Mnason",
  "Moloch", "Moses", "Myra", "Mysia", "Naaman", "Naasson", "Nachor", "Nagge", "Nain",
  "Narcissus", "Nathan", "Nathanael", "Naum", "Nazarene", "Nazarenes", "Nazareth", "Neapolis",
  "Nephthalim", "Nereus", "Neri", "Nicanor", "Nicodemus", "Nicolaitanes", "Nicolas", "Nicopolis",
  "Niger", "Nineve", "Nineveh", "Ninevites", "Noah", "Noe", "Nymphas", "Obed", "Olives",
  "Olivet", "Olympas", "Onesimus", "Onesiphorus", "Osee", "Ozias", "Pamphylia", "Paphos",
  "Parmenas", "Patara", "Patmos", "Patrobas", "Paul", "Paulus", "Perga", "Pergamos", "Persis",
  "Peter", "Phalec", "Phanuel", "Pharaoh", "Phares", "Pharisee", "Pharisees", "Phebe", "Phenice",
  "Phenicia", "Philadelphia", "Philemon", "Philetus", "Philip", "Philippi", "Philippians",
  "Philologus", "Phlegon", "Phrygia", "Phygellus", "Pilate", "Pisidia", "Pollux", "Pontius",
  "Pontus", "Porcius", "Praetorium", "Prisca", "Priscilla", "Prochorus", "Ptolemais", "Publius",
  "Pudens", "Puteoli", "Quartus", "Rachab", "Rachel", "Ragau", "Rahab", "Rama", "Rebecca",
  "Remphan", "Reuben", "Rhegium", "Rhesa", "Rhoda", "Rhodes", "Roboam", "Roman", "Romans",
  "Rome", "Rufus", "Ruth", "Sadducees", "Sadoc", "Sala", "Salamis", "Salathiel", "Salem",
  "Salim", "Salmon", "Salmone", "Salome", "Samaria", "Samaritan", "Samaritans", "Samos",
  "Samothracia", "Samson", "Samuel", "Sapphira", "Sara", "Sarah", "Sardis", "Sarepta", "Saron",
  "Saruch", "Satan", "Saul", "Sceva", "Scythian", "Secundus", "Seleucia", "Sem", "Semei",
  "Sergius", "Seth", "Sidon", "Silas", "Siloam", "Silvanus", "Simeon", "Simon", "Sina", "Sinai",
  "Sion", "Smyrna", "Sodom", "Sodoma", "Solomon", "Sopater", "Sosipater", "Sosthenes", "Spain",
  "Stachys", "Stephanas", "Stephen", "Stoicks", "Susanna", "Sychar", "Sychem", "Syntyche",
  "Syracuse", "Syria", "Syrian", "Syrophenician", "Tabitha", "Tarsus", "Tertius", "Tertullus",
  "Thaddaeus", "Thamar", "Thara", "Theophilus", "Thessalonians", "Thessalonica", "Theudas",
  "Thomas", "Thyatira", "Tiberias", "Tiberius", "Timaeus", "Timon", "Timotheus", "Timothy",
  "Titus", "Trachonitis", "Troas", "Trogyllium", "Trophimus", "Tryphena", "Tryphosa", "Tychicus",
  "Tyrannus", "Tyre", "Urbane", "Urias", "Zabulon", "Zacchaeus", "Zacharias", "Zara", "Zebedee",
  "Zelotes", "Zenas", "Zorobabel"
]);

export function quizWords(v, names) {
  const toks = v.t.split(" ").map((w, i) => ({ w, i, core: qCore(w) }));
  const count = c => toks.filter(t => t.core.toLowerCase() === c.toLowerCase()).length;
  return toks.filter(
    x =>
      x.core.length >= 4 &&
      !/'/.test(x.core) &&
      !QUIZ_STOP.has(x.core.toLowerCase()) &&
      count(x.core) === 1 &&
      (names
        ? x.i > 0 &&
          !/[.:;?!]$/.test(toks[x.i - 1].w) &&
          !(
            /,$/.test(toks[x.i - 1].w) &&
            /^(saying|said|saith|cried|crying|voice|answered|written)$/i.test(toks[x.i - 1].core)
          ) &&
          NT_NAMES.has(x.core) &&
          !QUIZ_LOWER.has(x.core.toLowerCase()) &&
          !/^(Praise|Write|Come|Behold|Blessed|Woe|Verily|Fear|Rejoice|Alleluia|Hosanna|Glory|Hail|Arise|Go|Lo|Yea|Nay|Wherefore|Therefore)$/.test(
            x.core
          ) &&
          !/^(God|Lord|LORD|Christ|Holy|Ghost|Spirit|Father|Son|Amen|Lamb|Saviour|Almighty)$/.test(
            x.core
          )
        : /^[a-z]+$/.test(x.core) && x.core.length >= 5)
  );
}

// Wrong answers that look like the right one: same ending first, then similar length.
export function lookalikes(pool, ans) {
  const end = ans.slice(-2);
  return shuffle(pool.filter(w => w.toLowerCase() !== ans.toLowerCase())).sort(
    (a, b) =>
      (a.slice(-2) === end ? 0 : 2) +
      Math.min(2, Math.abs(a.length - ans.length) / 3) -
      ((b.slice(-2) === end ? 0 : 2) + Math.min(2, Math.abs(b.length - ans.length) / 3))
  );
}

export function blankVerse(v, tok) {
  const words = v.t.split(" ");
  const pre = tok.w.slice(0, tok.w.indexOf(tok.core));
  const post = tok.w.slice(tok.w.indexOf(tok.core) + tok.core.length);
  return words
    .map((w, i) =>
      i === tok.i ? `${esc(pre)}<span class="qz-blank">_____</span>${esc(post)}` : esc(w)
    )
    .join(" ");
}

/* ---------- Event questions: who said it, who did it, what happened ---------- */
// Groups who speak and act in the narrative, alongside named people.
// prettier-ignore
const GROUPS = [
  "the disciples", "his disciples", "the apostles", "the Pharisees", "the Sadducees", "the scribes",
  "the chief priests", "the elders", "the high priest", "the Jews", "the multitude", "the people",
  "the soldiers", "the centurion", "the angel", "the devil", "the woman", "the servants",
  "the officers", "the governor", "the young man", "the damsel", "the ruler", "the lawyer",
  "the leper", "the jailor", "the chief captain", "the king", "the steward", "the thief"
];
// Named words that are places or nations, never the person who spoke or acted.
// prettier-ignore
const NOT_PEOPLE = new Set([
  "Israel", "Jerusalem", "Egypt", "Galilee", "Judaea", "Asia", "Macedonia", "Achaia", "Rome",
  "Babylon", "Sodom", "Capernaum", "Bethlehem", "Nazareth", "Samaria", "Syria", "Jordan",
  "Jews", "Gentiles", "Greeks", "Christ", "Lord", "God", "Gentile", "Antioch", "Ephesus", "Corinth"
]);
// Well-known people, used when a day's reading has too few speakers to choose from.
// prettier-ignore
export const QUIZ_PEOPLE = [
  "Jesus", "Peter", "John", "Paul", "Pilate", "Herod", "Judas", "Thomas", "Philip", "Andrew",
  "Martha", "Mary", "Nicodemus", "Barnabas", "Stephen", "The disciples", "The Pharisees",
  "The chief priests", "The multitude"
];
// "the disciples" or "The disciples"; names must start with a capital letter.
const GROUP_RE = GROUPS.map(g => `[${g[0].toUpperCase()}${g[0]}]${g.slice(1)}`).join("|");
const WHO = `(Simon Peter|John the Baptist|Mary Magdalene|Judas Iscariot|${GROUP_RE}|[A-Z][a-z]+)`;
const LEAD = "(?:^|[;:.?!] |, and |, then |, but )(?:And |Then |But |Now |So |and |then |but )?";
const SPEECH = new RegExp(
  `${LEAD}${WHO} (?:answered and said|answering said|said|saith|cried|spake|answered|asked)` +
    `(?: unto [^,:;]+| to [^,:;]+| among themselves)?[,:] (.+)$`
);
const SPEECH_AFTER = new RegExp(
  `^(?:And |Then |But )?(?:said|saith|answered) ${WHO}(?: unto [^,:;]+)?[,:] (.+)$`
);
const NOT_DEED =
  /^(said|saith|answered|answering|spake|asked|cried|is|was|were|are|be|being|had|hath|have|shall|will|would|should|could|may|might|must|did|do|doth|also|himself|herself|therefore|then|not)$/;
const DEED = new RegExp(`${LEAD}${WHO} ([a-z]+)\\b([^;:.?!]*)`, "g");
const DEED_VERB =
  /^(went|came|took|saw|began|sat|rose|arose|fell|gave|brought|cast|ran|stood|wept|fled|hid|met|sought|shewed|put|left|set|bare|bore|knew|heard|found|led|brake|smote|struck|caught|bound|loosed|spit|wrote|dwelt|abode|[a-z]{3,}ed)$/;

const cap = w => w.charAt(0).toUpperCase() + w.slice(1);
// "Simon Peter" and "Peter" are one person; groups start with a capital letter.
function whoName(raw) {
  const w = raw.trim();
  const low = w.toLowerCase();
  if (GROUPS.includes(low)) {
    return cap(low === "his disciples" ? "the disciples" : low);
  }
  if (w === "Simon Peter") {
    return "Peter";
  }
  if (/^(John the Baptist|Mary Magdalene|Judas Iscariot)$/.test(w)) {
    return w;
  }
  return NT_NAMES.has(w) && !NOT_PEOPLE.has(w) ? w : null;
}
const words = s => s.trim().split(/\s+/).length;
const clip = (s, n) => {
  const w = s.trim().split(/\s+/);
  return w.length > n ? w.slice(0, n).join(" ") + "…" : s.trim();
};

// Every "X said, …" in some verses: { who, quote, v }
export function speeches(verses) {
  const out = [];
  verses.forEach(v => {
    const m = v.t.match(SPEECH) || v.t.match(SPEECH_AFTER);
    const who = m && whoName(m[1]);
    // Just the spoken words: drop a leading "and said," and stop where the story picks up again.
    const quote =
      m &&
      m[2]
        .replace(/^(?:and )?(?:said|saying|saith),\s*/i, "")
        .split(
          /[.?!;:] (?:And|Then|But|So|Now) (?:he|she|they|when|[A-Z][a-z]+)\b|[.?!;:] [A-Z][a-z]+ (?:said|saith|answered)\b/
        )[0]
        .replace(/[.,;:]$/, "");
    if (who && quote && words(quote) >= 5) {
      out.push({ who, quote: clip(quote, 28), v });
    }
  });
  return out;
}
// Every "X went out, and wept bitterly" in some verses: { who, deed, v }
export function deeds(verses) {
  const out = [];
  verses.forEach(v => {
    for (const m of v.t.matchAll(DEED)) {
      const who = whoName(m[1]);
      const verb = m[2];
      // Stop before any speech or a second person's action joins the clause.
      const deed = (verb + m[3])
        .split(
          /, (?:and )?(?:he |she |they )?(?:said|saying|saith)\b| and said\b|, and (?:he|she|they|it|there)\b|, and when\b| \(/
        )[0]
        .replace(/[,\s]+$/, "");
      if (
        who &&
        DEED_VERB.test(verb) &&
        !NOT_DEED.test(verb) &&
        words(deed) >= 4 &&
        words(deed) <= 24
      ) {
        out.push({ who, deed, v });
        break; // one per verse
      }
    }
  });
  return out;
}
// The whole of each book in today's reading (already loaded for the reader), for wrong answers.
function bookVerses(day, kjv) {
  const p = PLAN[day - 1];
  const books = [...new Set(CHAPTERS.slice(p.from, p.to).map(c => c.b))];
  const out = [];
  books.forEach(b =>
    (kjv[b] || []).forEach((ch, ci) =>
      ch.forEach((t, i) =>
        out.push({
          c: { b, c: ci + 1 },
          v: i + 1,
          t,
          ref: `${b} ${ci + 1}:${i + 1}`,
          chap: `${b} ${ci + 1}`
        })
      )
    )
  );
  return out;
}

export const QUIZ_LENGTH = 7;

export function makeQuiz(day, kjv) {
  const verses = quizVerses(day, kjv);
  const used = new Set();
  QUIZ_LOWER = new Set(
    verses.flatMap(v =>
      v.t
        .split(" ")
        .map(qCore)
        .filter(c => /^[a-z]+$/.test(c))
    )
  );
  const allWords = [
    ...new Set(verses.flatMap(v => quizWords(v, false).map(x => x.core.toLowerCase())))
  ];
  const allNames = [...new Set(verses.flatMap(v => quizWords(v, true).map(x => x.core)))];
  const freshVerse = test => shuffle(verses.filter(v => !used.has(v.ref) && test(v)))[0];
  // Events in today's chapters (the questions) and in the rest of the same books (wrong answers).
  const today = new Set(verses.map(v => v.ref));
  const todayText = new Set(verses.map(v => v.t));
  const whole = bookVerses(day, kjv);
  const elsewhere = whole.filter(v => !today.has(v.ref));
  const said = speeches(verses);
  const done = deeds(verses);
  const bookDeeds = deeds(whole);
  // Speakers and actors from today first, then the rest of the book, then well-known names.
  const people = [
    ...new Set([
      ...shuffle([...said, ...done].map(x => x.who)),
      ...shuffle([...speeches(elsewhere), ...bookDeeds].map(x => x.who)),
      ...shuffle(QUIZ_PEOPLE)
    ])
  ];
  const fresh = list => shuffle(list.filter(x => !used.has(x.v.ref)))[0];
  // Peter is also called Simon, so "Simon" can't be a wrong answer when Peter is right.
  const others = (ans, n) =>
    people.filter(w => w !== ans && !(ans === "Peter" && w === "Simon")).slice(0, n);
  const make = {
    said() {
      const x = fresh(said);
      if (!x) {
        return null;
      }
      used.add(x.v.ref);
      return {
        kind: "Who said it?",
        prompt: "Who said this?",
        body: `“${esc(x.quote)}”`,
        options: shuffle([x.who, ...others(x.who, 3)]),
        answer: x.who,
        v: x.v
      };
    },
    did() {
      const x = fresh(done);
      if (!x) {
        return null;
      }
      used.add(x.v.ref);
      return {
        kind: "Who did it?",
        prompt: "Who did this?",
        body: `<b>Who</b> ${esc(x.deed)}?`,
        options: shuffle([x.who, ...others(x.who, 3)]),
        answer: x.who,
        v: x.v
      };
    },
    what() {
      const x = fresh(done.filter(d => words(d.deed) >= 5));
      if (!x) {
        return null;
      }
      // Wrong answers: things other people did, from today or elsewhere in the book.
      const wrong = [
        ...new Set(
          shuffle(
            [...done, ...bookDeeds].filter(
              d => d.who !== x.who && d.v.ref !== x.v.ref && words(d.deed) >= 4
            )
          ).map(d => clip(d.deed, 14))
        )
      ];
      const ans = clip(x.deed, 14);
      const opts = wrong.filter(d => d !== ans).slice(0, 3);
      if (opts.length < 3) {
        return null;
      }
      used.add(x.v.ref);
      return {
        kind: "What happened?",
        prompt: `In ${x.v.chap}, what did ${x.who.replace(/^The /, "the ")} do?`,
        body: "",
        options: shuffle([ans, ...opts]),
        answer: ans,
        v: x.v
      };
    },
    inReading() {
      const near = n => v => Math.abs(words(v.t) - n) <= Math.max(4, n * 0.4);
      const x = freshVerse(v => words(v.t) >= 8 && words(v.t) <= 26);
      if (!x) {
        return null;
      }
      // A verse repeated in today's reading (e.g. "He that hath an ear…") can't be a wrong answer.
      const opts = [...new Set(shuffle(elsewhere.filter(near(words(x.t)))).map(v => v.t))]
        .filter(t => !todayText.has(t))
        .slice(0, 3);
      if (opts.length < 3) {
        return null;
      }
      used.add(x.ref);
      return {
        kind: "Was it in the reading?",
        prompt: "Which of these verses is from today's reading?",
        body: "",
        options: shuffle([x.t, ...opts]),
        answer: x.t,
        v: x
      };
    },
    finish() {
      const v = freshVerse(v => v.t.split(" ").length >= 8 && quizWords(v, false).length);
      if (!v) {
        return null;
      }
      const tok = pick(quizWords(v, false));
      const ans = tok.core.toLowerCase();
      const opts = [...new Set([...lookalikes(allWords, ans), ...shuffle(QUIZ_FALLBACK)])]
        .filter(w => w !== ans)
        .slice(0, 3);
      used.add(v.ref);
      return {
        kind: "Finish the verse",
        prompt: "Which word completes this verse?",
        body: blankVerse(v, tok),
        options: shuffle([ans, ...opts]),
        answer: ans,
        v
      };
    },
    name() {
      const v = freshVerse(v => quizWords(v, true).length);
      if (!v) {
        return null;
      }
      const tok = pick(quizWords(v, true));
      const ans = tok.core;
      const opts = [...new Set([...shuffle(allNames), ...shuffle(QUIZ_NAMES)])]
        .filter(w => w !== ans)
        .slice(0, 3); // day's own names first
      used.add(v.ref);
      return {
        kind: "Who or where?",
        prompt: "Which name completes this verse?",
        body: blankVerse(v, tok),
        options: shuffle([ans, ...opts]),
        answer: ans,
        v
      };
    }
  };
  // Event questions first; when a reading has few (the letters), verse questions fill in, no more
  // than three of a kind.
  const order = ["said", "did", "what", "inReading", "said", "did", "finish"];
  const fallback = ["said", "did", "what", "inReading", "finish", "name"];
  const kinds = {};
  const out = [];
  for (const want of order) {
    // A short reading may need a fourth of one kind.
    for (const k of [want, ...fallback, "inReading", "finish"]) {
      const last = k === "finish" && out.length < order.indexOf(want) + 1;
      if ((kinds[k] || 0) >= 3 && !last) {
        continue;
      }
      const q = make[k]();
      if (q) {
        kinds[k] = (kinds[k] || 0) + 1;
        out.push(q);
        break;
      }
    }
  }
  return out;
}
