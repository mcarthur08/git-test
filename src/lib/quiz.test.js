import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  qCore,
  shuffle,
  pick,
  lookalikes,
  blankVerse,
  quizVerses,
  quizWords,
  speeches,
  deeds,
  makeQuiz,
  QUIZ_LENGTH,
  QUIZ_STOP,
  QUIZ_NAMES,
  QUIZ_PEOPLE,
  QUIZ_FALLBACK,
  NT_NAMES
} from "./quiz.js";
import { BOOKS, CHAPTERS, PLAN, DAYS } from "./data.js";

// The real KJV text the app ships, keyed by book name like the store's `kjv`.
const KJV = Object.fromEntries(
  BOOKS.map(([b]) => [
    b,
    JSON.parse(
      readFileSync(resolve(process.cwd(), "public/kjv", b.replace(/ /g, "") + ".json"), "utf8")
    )
  ])
);
const v = t => ({ t, ref: "X 1:1", chap: "X 1" });

afterEach(() => vi.restoreAllMocks());

describe("KJV data", () => {
  it("has every chapter of every book", () => {
    CHAPTERS.forEach(c => {
      expect(KJV[c.b][c.c - 1], `${c.b} ${c.c}`).toBeInstanceOf(Array);
      expect(KJV[c.b][c.c - 1].length).toBeGreaterThan(0);
    });
  });

  it("has the right number of chapters in each book", () => {
    BOOKS.forEach(([b, n]) => expect(KJV[b], b).toHaveLength(n));
  });

  it("has 7,957 verses, all non-empty text", () => {
    let total = 0;
    Object.values(KJV).forEach(book =>
      book.forEach(ch =>
        ch.forEach(t => {
          total++;
          expect(typeof t).toBe("string");
          expect(t.trim().length).toBeGreaterThan(0);
        })
      )
    );
    expect(total).toBe(7957);
  });

  it("starts John 3:16 with the familiar words", () => {
    expect(KJV.John[2][15]).toMatch(/^For God so loved the world/);
  });
});

describe("helpers", () => {
  it("qCore strips punctuation from the ends but keeps apostrophes", () => {
    expect(qCore("“world,”")).toBe("world");
    expect(qCore("(Peter)")).toBe("Peter");
    expect(qCore("Lord's")).toBe("Lord's");
    expect(qCore("...")).toBe("");
  });

  it("shuffle returns a new array with the same items", () => {
    const a = [1, 2, 3, 4, 5, 6, 7, 8];
    const b = shuffle(a);
    expect(b).not.toBe(a);
    expect([...b].sort()).toEqual(a);
    expect(a).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("shuffle can produce every ordering of three items", () => {
    const seen = new Set();
    for (let i = 0; i < 400; i++) {
      seen.add(shuffle([1, 2, 3]).join());
    }
    expect(seen.size).toBe(6);
  });

  it("shuffle copes with empty and single-item arrays", () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([9])).toEqual([9]);
  });

  it("pick chooses from the whole array", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pick(["a", "b", "c"])).toBe("a");
    Math.random.mockReturnValue(0.999);
    expect(pick(["a", "b", "c"])).toBe("c");
  });

  it("lookalikes leaves out the answer in any case and prefers the same ending", () => {
    const out = lookalikes(["mercy", "story", "peace", "MERCY", "glory", "power"], "glory");
    expect(out).toHaveLength(5);
    expect(out.map(w => w.toLowerCase())).not.toContain("glory");
    expect(out[0]).toBe("story");
  });

  it("lookalikes does not change the pool", () => {
    const pool = ["a1", "b2", "c3"];
    lookalikes(pool, "x");
    expect(pool).toEqual(["a1", "b2", "c3"]);
  });

  it("the stop list, fallback words and names are free of duplicates and filler", () => {
    expect(new Set(QUIZ_FALLBACK).size).toBe(QUIZ_FALLBACK.length);
    expect(new Set(QUIZ_NAMES).size).toBe(QUIZ_NAMES.length);
    expect(new Set(QUIZ_PEOPLE).size).toBe(QUIZ_PEOPLE.length);
    QUIZ_FALLBACK.forEach(w => expect(QUIZ_STOP.has(w), w).toBe(false));
  });

  it("only offers real New Testament names as wrong 'who or where' answers", () => {
    QUIZ_NAMES.forEach(n => expect(NT_NAMES.has(n), n).toBe(true));
  });
});

describe("blankVerse", () => {
  it("replaces the chosen word with a blank and keeps its punctuation", () => {
    const html = blankVerse(v("For God so loved the world, that he gave his Son."), {
      w: "world,",
      i: 5,
      core: "world"
    });
    expect(html).toBe(
      'For God so loved the <span class="qz-blank">_____</span>, that he gave his Son.'
    );
  });

  it("keeps opening quotes and brackets around the blank", () => {
    const html = blankVerse(v("He said (mercy) now"), { w: "(mercy)", i: 2, core: "mercy" });
    expect(html).toBe('He said (<span class="qz-blank">_____</span>) now');
  });

  it("escapes the rest of the verse", () => {
    const html = blankVerse(v('He said "hi" & <left>'), { w: "<left>", i: 4, core: "left" });
    expect(html).toBe('He said &quot;hi&quot; &amp; &lt;<span class="qz-blank">_____</span>&gt;');
  });
});

describe("quizWords", () => {
  const verse = v(
    "Jesus said unto them, I am the bread of life: he that cometh to me shall never hunger."
  );

  it("offers lowercase words of five or more letters that are not filler", () => {
    const cores = quizWords(verse, false).map(x => x.core);
    expect(cores).toEqual(expect.arrayContaining(["bread", "never", "hunger"]));
    ["unto", "them", "Jesus", "life", "cometh", "shall"].forEach(w =>
      expect(cores).not.toContain(w)
    );
  });

  it("skips words that repeat in the verse", () => {
    const cores = quizWords(
      v("Blessed are the merciful: for they shall obtain mercy and mercy again."),
      false
    ).map(x => x.core);
    expect(cores).not.toContain("mercy");
    expect(cores).toContain("merciful");
  });

  it("skips contractions", () => {
    expect(
      quizWords(v("They said the Lord's servant shall speak plainly."), false).map(x => x.core)
    ).not.toContain("Lord's");
  });

  it("returns each word's position so it can be blanked", () => {
    quizWords(verse, false).forEach(x => expect(verse.t.split(" ")[x.i]).toBe(x.w));
  });

  it("offers names mid-sentence", () => {
    const cores = quizWords(v("And when Herod heard these things, he was troubled."), true).map(
      x => x.core
    );
    expect(cores).toEqual(["Herod"]);
  });

  it("does not offer a name that starts the verse or a sentence", () => {
    expect(quizWords(v("Peter went out and wept."), true)).toEqual([]);
    expect(quizWords(v("He came home. Peter wept bitterly."), true)).toEqual([]);
  });

  it("does not offer a name right after 'answered,' or 'saying,'", () => {
    expect(quizWords(v("And he answered, Peter wept bitterly today."), true)).toEqual([]);
  });

  it("does not offer names that are really titles or exclamations", () => {
    expect(quizWords(v("And they said, Behold, Christ shall come."), true)).toEqual([]);
  });
});

describe("speeches", () => {
  it("finds 'X said unto them, …'", () => {
    const out = speeches([
      v(
        "And Jesus answered and said unto them, The hour is come, that the Son of man should be glorified."
      )
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].who).toBe("Jesus");
    expect(out[0].quote).toBe("The hour is come, that the Son of man should be glorified");
  });

  it("finds 'Then saith X unto them, …'", () => {
    const out = speeches([v("Then saith Jesus unto them, Fill the waterpots with water now.")]);
    expect(out.map(s => s.who)).toEqual(["Jesus"]);
  });

  it("names groups with a capital letter", () => {
    const out = speeches([
      v(
        "And the disciples said unto him, Lord, teach us to pray as John also taught his disciples."
      )
    ]);
    expect(out[0].who).toBe("The disciples");
  });

  it("treats Simon Peter as Peter", () => {
    const out = speeches([
      v("Then Simon Peter answered and said unto him, Lord, to whom shall we go from here?")
    ]);
    expect(out[0].who).toBe("Peter");
  });

  it("ignores places and nations as speakers", () => {
    expect(
      speeches([v("And Israel said unto them, Where are ye going this day my friends?")])
    ).toEqual([]);
  });

  it("ignores very short quotes", () => {
    expect(speeches([v("And Peter said, Lord, save me.")])).toEqual([]);
  });

  it("stops the quote where the story picks up again", () => {
    const out = speeches([
      v(
        "And Jesus said unto them, Follow me and I will make you fishers of men. And they straightway left their nets."
      )
    ]);
    expect(out[0].quote).toBe("Follow me and I will make you fishers of men");
  });

  it("clips very long quotes", () => {
    const long = Array.from({ length: 60 }, (_, i) => "word" + i).join(" ");
    const out = speeches([v(`And Jesus said unto them, ${long}`)]);
    expect(out[0].quote.split(" ")).toHaveLength(28);
    expect(out[0].quote.endsWith("…")).toBe(true);
  });

  it("returns the verse alongside", () => {
    const verse = v("And Jesus said unto them, Follow me and I will make you fishers of men.");
    expect(speeches([verse])[0].v).toBe(verse);
  });

  it("finds nothing in plain narrative", () => {
    expect(speeches([v("In the beginning was the Word, and the Word was with God.")])).toEqual([]);
  });
});

describe("deeds", () => {
  it("finds 'X went out, and wept bitterly'", () => {
    const out = deeds([v("And Peter went out, and wept bitterly.")]);
    expect(out).toEqual([
      expect.objectContaining({ who: "Peter", deed: "went out, and wept bitterly" })
    ]);
  });

  it("stops before speech joins the clause", () => {
    const out = deeds([
      v("And Jesus went up into a mountain, and said unto them, Peace be with you.")
    ]);
    expect(out[0].deed).toBe("went up into a mountain");
  });

  it("ignores speech verbs and being verbs", () => {
    expect(deeds([v("And Peter said unto him, Lord, thou knowest all things.")])).toEqual([]);
    expect(deeds([v("And Peter was a man of great faith and courage.")])).toEqual([]);
  });

  it("ignores deeds that are too short to make a question", () => {
    expect(deeds([v("And Peter wept.")])).toEqual([]);
  });

  it("ignores places as doers", () => {
    expect(deeds([v("And Jerusalem went out to him in great numbers.")])).toEqual([]);
  });

  it("takes at most one deed per verse", () => {
    const out = deeds([
      v("And Peter went out, and wept bitterly. And Paul went down to the ship quickly.")
    ]);
    expect(out).toHaveLength(1);
  });
});

describe("quizVerses", () => {
  it("lists the verses of the day's chapters with references", () => {
    const out = quizVerses(1, KJV);
    expect(out[0]).toMatchObject({ v: 1, ref: "Matthew 1:1", chap: "Matthew 1" });
    expect(out[0].t).toMatch(/^The book of the generation of Jesus Christ/);
    expect(out.every(x => x.t)).toBe(true);
  });

  it("covers every verse in the New Testament exactly once across the plan", () => {
    const refs = new Set();
    let n = 0;
    for (let d = 1; d <= DAYS; d++) {
      quizVerses(d, KJV).forEach(x => {
        refs.add(x.ref);
        n++;
      });
    }
    expect(n).toBe(7957);
    expect(refs.size).toBe(7957);
  });

  it("leaves the chapter number out for one-chapter books", () => {
    const day = PLAN.find(d => CHAPTERS.slice(d.from, d.to).some(c => c.b === "Jude")).day;
    const jude = quizVerses(day, KJV).filter(x => x.c.b === "Jude");
    expect(jude[0]).toMatchObject({ ref: "Jude:1", chap: "Jude" });
  });

  it("skips a chapter that is missing from the text instead of crashing", () => {
    expect(quizVerses(1, { Matthew: [] })).toEqual([]);
  });
});

describe("makeQuiz", () => {
  const SAFE_HTML = /^(?:[^<]|<span class="qz-blank">|<\/span>|<b>|<\/b>)*$/;

  const check = (q, day) => {
    const at = `day ${day}, "${q.kind}"`;
    expect(q.options, at).toHaveLength(4);
    expect(
      new Set(q.options.map(o => o.toLowerCase())).size,
      `${at}: duplicate options ${q.options}`
    ).toBe(4);
    expect(
      q.options.filter(o => o === q.answer),
      `${at}: answer appears once`
    ).toHaveLength(1);
    q.options.forEach(o => expect(o.trim().length, at).toBeGreaterThan(0));
    expect(q.prompt, at).toBeTruthy();
    expect(q.kind, at).toBeTruthy();
    expect(q.v.ref, at).toBeTruthy();
    expect(q.body, at).toMatch(SAFE_HTML);
  };

  it("builds a full quiz for every day of the plan, many times over", () => {
    for (let day = 1; day <= DAYS; day++) {
      for (let run = 0; run < 3; run++) {
        const quiz = makeQuiz(day, KJV);
        expect(quiz, `day ${day} length`).toHaveLength(QUIZ_LENGTH);
        quiz.forEach(q => check(q, day));
      }
    }
  });

  it("never asks about the same verse twice in one quiz", () => {
    for (let day = 1; day <= DAYS; day++) {
      const refs = makeQuiz(day, KJV).map(q => q.v.ref);
      expect(new Set(refs).size, `day ${day}: ${refs}`).toBe(refs.length);
    }
  });

  // The design is three of a kind, with a fourth allowed when a short reading (the letters) runs out of
  // other questions. A fifth is rare (seen on days 49 and 62) and is the loosest bound that never flakes.
  it("asks no more than five questions of one kind", () => {
    for (let day = 1; day <= DAYS; day++) {
      const kinds = {};
      makeQuiz(day, KJV).forEach(q => (kinds[q.kind] = (kinds[q.kind] || 0) + 1));
      Object.entries(kinds).forEach(([k, n]) =>
        expect(n, `day ${day} ${k}`).toBeLessThanOrEqual(5)
      );
    }
  });

  it("only draws questions from the day's own reading", () => {
    for (let day = 1; day <= DAYS; day++) {
      const today = new Set(quizVerses(day, KJV).map(x => x.ref));
      makeQuiz(day, KJV).forEach(q =>
        expect(today.has(q.v.ref), `day ${day}: ${q.v.ref}`).toBe(true)
      );
    }
  });

  it("completes the verse with a word that really is in it", () => {
    for (let day = 1; day <= DAYS; day++) {
      makeQuiz(day, KJV)
        .filter(q => q.kind === "Finish the verse")
        .forEach(q => {
          expect(q.v.t.toLowerCase()).toContain(q.answer);
          expect(q.body).toContain("qz-blank");
          expect(q.options.filter(o => o !== q.answer).every(o => /^[a-z]+$/.test(o))).toBe(true);
        });
    }
  });

  it("completes a name with a name that really is in the verse", () => {
    for (let day = 1; day <= DAYS; day++) {
      makeQuiz(day, KJV)
        .filter(q => q.kind === "Who or where?")
        .forEach(q => {
          expect(q.v.t).toContain(q.answer);
          expect(NT_NAMES.has(q.answer)).toBe(true);
        });
    }
  });

  it("marks a verse from today's reading and never offers another verse from it", () => {
    for (let day = 1; day <= DAYS; day++) {
      const todayText = new Set(quizVerses(day, KJV).map(x => x.t));
      makeQuiz(day, KJV)
        .filter(q => q.kind === "Was it in the reading?")
        .forEach(q => {
          expect(todayText.has(q.answer)).toBe(true);
          q.options
            .filter(o => o !== q.answer)
            .forEach(o => expect(todayText.has(o), `day ${day}`).toBe(false));
        });
    }
  });

  it("never offers 'Simon' as a wrong answer when Peter is right", () => {
    for (let day = 1; day <= DAYS; day++) {
      makeQuiz(day, KJV)
        .filter(q => q.answer === "Peter")
        .forEach(q => expect(q.options, `day ${day}`).not.toContain("Simon"));
    }
  });

  it("asks 'who' questions with people or groups as the options", () => {
    for (let day = 1; day <= DAYS; day++) {
      makeQuiz(day, KJV)
        .filter(q => q.kind === "Who said it?" || q.kind === "Who did it?")
        .forEach(q => {
          q.options.forEach(o => expect(/^[A-Z]/.test(o), `day ${day}: ${o}`).toBe(true));
          expect(q.options).not.toContain("Israel");
        });
    }
  });

  it("escapes quotes and deeds so the question body is safe to inject", () => {
    for (let day = 1; day <= DAYS; day++) {
      makeQuiz(day, KJV).forEach(q => expect(q.body).toMatch(SAFE_HTML));
    }
  });

  it("copes with a day whose books have not loaded", () => {
    expect(() => makeQuiz(1, { Matthew: [] })).not.toThrow();
  });
});
