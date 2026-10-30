import { useLayoutEffect } from "react";
import { lsGet, lsSet } from "@/lib/util.js";
import { journeyPos, routePath, miniViewBox } from "@/lib/journey.js";
import { seenKey, walkPlan, walkAt } from "@/lib/walk.js";
import { arrive, selectStop } from "@/actions";

// When you have read more days since the map last showed you, the character walks the new stretch of road,
// pausing at each stop it reaches. It is drawn by moving the figure and the walked line directly, a frame at a time,
// so nothing is rebuilt. `waiting` holds the walk back (at the old spot) while a reveal card is on screen.
export function useWalk({ id, n, waiting, mini, me, path, svg }) {
  useLayoutEffect(() => {
    if (!id) {
      return undefined;
    }
    const key = seenKey(id);
    const seen = lsGet(key);
    if (typeof seen !== "number" || seen >= n) {
      lsSet(key, n);
      return undefined;
    }
    const fin = journeyPos(n);
    const put = at => {
      const p = journeyPos(at);
      me.current?.setAttribute(
        "transform",
        `translate(${(p.x - fin.x).toFixed(1)} ${(p.y - fin.y).toFixed(1)})`
      );
      path.current?.setAttribute("d", routePath(at));
      if (mini) {
        svg.current?.setAttribute("viewBox", miniViewBox(at));
      }
    };
    const settle = () => {
      me.current?.removeAttribute("transform");
      me.current?.classList.remove("walking");
      path.current?.setAttribute("d", routePath(n));
      if (mini) {
        svg.current?.setAttribute("viewBox", miniViewBox(n));
      }
    };
    put(seen);
    if (waiting) {
      return settle;
    }
    const plan = walkPlan(seen, n);
    const last = plan.crossed[plan.crossed.length - 1];
    const done = () => {
      settle();
      lsSet(key, n);
      if (!mini && last !== undefined) {
        selectStop(last);
      }
    };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (last !== undefined) {
        arrive(last);
      }
      done();
      return undefined;
    }
    me.current?.classList.add("walking");
    let raf;
    let start;
    let announced = -1;
    const frame = now => {
      start = start ?? now;
      const e = now - start;
      const at = walkAt(plan, e);
      put(at.n);
      if (at.stop !== null && at.stop !== announced) {
        announced = at.stop;
        arrive(at.stop);
      }
      if (e < plan.total) {
        raf = requestAnimationFrame(frame);
      } else {
        done();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      settle();
    };
  }, [id, n, waiting]);
}
