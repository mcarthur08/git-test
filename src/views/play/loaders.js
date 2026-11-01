// Each scene's code is loaded only when the scene is opened. A loaded scene gives: start (to begin it), buildCast (who is
// in it), LAYOUTS and layoutFor (its tall and wide places), and soundConfig (its own music moods and sounds, if any).
export const LOADERS = {
  cana: () => import("@/views/Cana/index.js").then(m => m.default),
  bethsaida: () => import("@/views/Bethsaida/index.js").then(m => m.default),
  galilee: () => import("@/views/Galilee/index.js").then(m => m.default),
  jericho: () => import("@/views/Jericho/index.js").then(m => m.default),
  capernaum: () => import("@/views/Capernaum/index.js").then(m => m.default),
  bethlehem: () => import("@/views/Bethlehem/index.js").then(m => m.default),
  nazareth: () => import("@/views/Nazareth/index.js").then(m => m.default),
  jordan: () => import("@/views/Jordan/index.js").then(m => m.default),
  wilderness: () => import("@/views/Wilderness/index.js").then(m => m.default),
  caesarea: () => import("@/views/Caesarea/index.js").then(m => m.default),
  samaria: () => import("@/views/Samaria/index.js").then(m => m.default),
  bethany: () => import("@/views/Bethany/index.js").then(m => m.default),
  jerusalem: () => import("@/views/Jerusalem/index.js").then(m => m.default)
};
