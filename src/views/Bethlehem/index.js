import { startBethlehem } from "./engine.js";
import { buildCast } from "@/lib/bethlehem/cast.js";
import { LAYOUTS, layoutFor } from "@/lib/bethlehem/layout.js";
import { soundConfig } from "@/lib/bethlehem/sound.js";

export default { start: startBethlehem, buildCast, LAYOUTS, layoutFor, soundConfig };
