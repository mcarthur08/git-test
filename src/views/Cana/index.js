import { startCana } from "./engine.js";
import { buildCast } from "@/lib/cana/cast.js";
import { LAYOUTS, layoutFor } from "@/lib/cana/layout.js";

// The wedding at Cana as a scene (see views/play/loaders.js): how to build its cast, which place fits a box, how to start
// it, and its sound (the default music and sounds, which were made for it).
export default { start: startCana, buildCast, LAYOUTS, layoutFor, soundConfig: {} };
