// KJV text: one small JSON file per book in kjv/, loaded when a reading needs it.
import { getState, setState } from "@/store.js";

const loadingBooks = {};
const bookFile = b => "kjv/" + b.replace(/ /g, "") + ".json";
export function loadBooks(list) {
  list.forEach(b => {
    if (b in getState().kjv || loadingBooks[b]) {
      return;
    }
    loadingBooks[b] = fetch(bookFile(b))
      .then(r => {
        if (!r.ok) {
          throw new Error(r.status);
        }
        return r.json();
      })
      .catch(() => null)
      .then(j => {
        delete loadingBooks[b];
        setState(s => ({ kjv: { ...s.kjv, [b]: j } }));
      });
  });
}
