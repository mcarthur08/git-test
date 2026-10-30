// Each scene's code is loaded only when the scene is opened. A loaded scene gives: start (to begin it), buildCast (who is
// in it), LAYOUTS and layoutFor (its tall and wide places), and soundConfig (its own music moods and sounds, if any).
export const LOADERS = {
  cana: () => import("@/views/Cana/index.js").then(m => m.default),
  bethsaida: () => import("@/views/Bethsaida/index.js").then(m => m.default),
  galilee: () => import("@/views/Galilee/index.js").then(m => m.default),
  jericho: () => import("@/views/Jericho/index.js").then(m => m.default)
};
