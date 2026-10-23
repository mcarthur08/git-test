# King James Version: New Testament text

One file per book (`Matthew.json`, `1Corinthians.json`, …). Each file is an array of chapters, and each chapter is an array of verse strings:

```json
[["The book of the generation of Jesus Christ…", "Abraham begat Isaac…"], ["Now when Jesus was born…"]]
```

- **Text:** King James Version (1769), public domain.
- **Source:** converted from [aruljohn/Bible-kjv](https://github.com/aruljohn/Bible-kjv).
- **Checked:** 27 books, 260 chapters, 7,957 verses, chapter counts matching the 70-day plan.

The app loads only the books needed for the day being read (see `loadBooks` in `src/actions.jsx`).
