// Daily quiz: 5 questions built from the day's KJV text.
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

export function makeQuiz(day, kjv) {
  const verses = quizVerses(day, kjv);
  const used = new Set();
  const chaps = [...new Set(verses.map(v => v.chap))];
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
  const make = {
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
    },
    chapter() {
      if (chaps.length < 2) {
        return null;
      }
      const v = freshVerse(v => v.t.split(" ").length >= 10);
      if (!v) {
        return null;
      }
      used.add(v.ref);
      // 3-chapter days borrow a neighboring chapter so there are always 4 choices
      const p = PLAN[day - 1];
      const near = [CHAPTERS[p.from - 1], CHAPTERS[p.to]]
        .filter(Boolean)
        .map(c => (c.one ? c.b : `${c.b} ${c.c}`));
      const opts = [...shuffle(chaps.filter(c => c !== v.chap)), ...near].slice(0, 3);
      return {
        kind: "Where was it?",
        prompt: "Which chapter is this verse from?",
        body: esc(v.t),
        options: shuffle([v.chap, ...opts]),
        answer: v.chap,
        v
      };
    }
  };
  const order =
    chaps.length >= 2
      ? ["chapter", "finish", "name", "finish", "chapter"]
      : ["finish", "name", "finish", "name", "finish"];
  return order
    .map(k => make[k]() || make.finish() || make.name())
    .filter(Boolean)
    .slice(0, 5);
}
