// Landmarks: a small illustration beside each town on the map, drawn from its story (the stable and star at
// Bethlehem, a stone water jar at Cana, a boat in the storm, the Temple at Jerusalem). Each is centred on (0, 0) in a
// box about 20 wide, then placed beside its stop at (dx, dy) and scaled by s, away from the town's name.
const INK = "#4a3721";
const ol = `stroke="${INK}" stroke-width=".7" stroke-linejoin="round"`;
const star = (x, y, r) =>
  `<path d="M${[...Array(10)]
    .map((_, i) => {
      const a = ((-90 + i * 36) * Math.PI) / 180;
      const rr = i % 2 ? r * 0.42 : r;
      return `${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`;
    })
    .join(" L")} Z" fill="#f2c94c" ${ol}/>`;

export const LANDMARKS = [
  {
    // Bethlehem: the stable under a star
    dx: 2,
    dy: 15,
    s: 0.9,
    svg: `<path d="M-7 5 V-2 L0 -7 L7 -2 V5 Z" fill="#9a7a56" ${ol}/><path d="M-9 -1 L0 -9 L9 -1 Z" fill="#6b4a2e" ${ol}/><rect x="-2" y="0" width="4" height="5" fill="#ffd46a"/>${star(
      10,
      -8,
      4
    )}`
  },
  {
    // Nazareth: houses on the hillside
    dx: 16,
    dy: -4,
    s: 1,
    svg: `<rect x="-10" y="-1" width="9" height="7" fill="#efe2c2" ${ol}/><rect x="1" y="-5" width="9" height="11" fill="#e2d0a6" ${ol}/><rect x="-7" y="2" width="3" height="4" fill="#5a4129"/><rect x="4" y="1" width="3" height="5" fill="#5a4129"/>`
  },
  {
    // River Jordan: a dove
    dx: -16,
    dy: -5,
    s: 1,
    svg: `<path d="M-8 1 Q-4 -7 2 -4 Q6 -8 9 -3 Q3 3 -8 1 Z" fill="#fbf8f0" ${ol}/><circle cx="8" cy="-4" r="2.2" fill="#fbf8f0" ${ol}/><path d="M10 -4 l3 1 l-3 1 z" fill="#e39a3a"/><path d="M-9 5 q3 -2 6 0 t6 0 t6 0" fill="none" stroke="#3f5f5c" stroke-width="1"/>`
  },
  {
    // The Wilderness: stones in the sand
    dx: -16,
    dy: -9,
    s: 1,
    svg: `<ellipse cx="-3" cy="2" rx="6" ry="3.8" fill="#8d877d" ${ol}/><ellipse cx="6" cy="3" rx="4.2" ry="2.8" fill="#a39d92" ${ol}/><ellipse cx="-9" cy="4" rx="3" ry="2" fill="#7d776d" ${ol}/><path d="M-10 8 q5 -3 10 0 t10 0" fill="none" stroke="#a88a52" stroke-width="1"/>`
  },
  {
    // Cana: a stone water jar
    dx: 14,
    dy: -6,
    s: 1,
    svg: `<path d="M-5 6 Q-8 -1 -4 -5 L4 -5 Q8 -1 5 6 Z" fill="#a98f6a" ${ol}/><ellipse cx="0" cy="-5" rx="4" ry="1.5" fill="#7a1f2c" ${ol}/><path d="M-6 1 Q0 3 6 1" fill="none" stroke="#6f5c3e" stroke-width=".8"/>`
  },
  {
    // Capernaum: a fishing boat
    dx: 0,
    dy: -14,
    s: 1,
    svg: `<path d="M-9 1 Q0 8 9 1 L7 -2 H-7 Z" fill="#8a5e34" ${ol}/><path d="M0 -2 V-11" stroke="${INK}" stroke-width=".9"/><path d="M0 -10 L7 -3 H0 Z" fill="#f4ead2" ${ol}/>`
  },
  {
    // Sea of Galilee: a boat in the storm
    dx: 7,
    dy: 14,
    s: 0.9,
    svg: `<g transform="rotate(-8)"><path d="M-8 3 Q0 9 8 3 L6 0 H-6 Z" fill="#8a5e34" ${ol}/><path d="M0 0 V-8" stroke="${INK}" stroke-width=".9"/></g><ellipse cx="-2" cy="-11" rx="7" ry="3.6" fill="#59627a" ${ol}/><path d="M0 -8 l-2 5 h2.4 l-1.4 5 l4 -6 h-2.4 l1.2 -4 z" fill="#ffe27a"/>`
  },
  {
    // Bethsaida: a basket of loaves and fish
    dx: 0,
    dy: -13,
    s: 1,
    svg: `<ellipse cx="-4.5" cy="-3" rx="3.6" ry="2.4" fill="#d9a25a" ${ol}/><ellipse cx="3" cy="-3.6" rx="3.6" ry="2.4" fill="#d9a25a" ${ol}/><path d="M-9 -1 H9 L6.5 6 H-6.5 Z" fill="#b98a4b" ${ol}/><path d="M-8 2 H8" stroke="#8a6230" stroke-width=".8"/><path d="M5 -5 l5 -3 l-.6 5 z" fill="#8fb3c9" ${ol}/>`
  },
  {
    // Caesarea Philippi: the snowy mountain
    dx: -17,
    dy: 2,
    s: 1.1,
    svg: `<path d="M-11 7 L0 -9 L11 7 Z" fill="#8d8a86" ${ol}/><path d="M0 -9 L4 -3 L1.4 -4.4 L0 -2 L-1.6 -4.4 L-4 -3 Z" fill="#f4f6f8"/>`
  },
  {
    // Samaria: Jacob's well
    dx: 16,
    dy: -4,
    s: 1,
    svg: `<path d="M-7 6 V0 Q0 -3 7 0 V6 Z" fill="#a39a8a" ${ol}/><ellipse cx="0" cy="0" rx="7" ry="2.2" fill="#4a5a68" ${ol}/><path d="M-6 0 V-9 M6 0 V-9 M-8 -9 H8" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/><path d="M0 -9 V-3" stroke="#c9b27a" stroke-width=".8"/>`
  },
  {
    // Jericho: a palm
    dx: 15,
    dy: 0,
    s: 1,
    svg: `<path d="M0 8 Q2 0 0 -9" fill="none" stroke="#5a4326" stroke-width="1.8" stroke-linecap="round"/><path d="M0 -9 q-6 -2 -9 3 M0 -9 q-7 -6 -10 -1 M0 -9 q6 -2 9 3 M0 -9 q7 -6 10 -1 M0 -9 q0 -6 2 -8" fill="none" stroke="#4f7a34" stroke-width="1.7" stroke-linecap="round"/>`
  },
  {
    // Bethany: an olive tree and the alabaster jar
    dx: 15,
    dy: 11,
    s: 0.9,
    svg: `<rect x="-9" y="-1" width="1.8" height="7" fill="#5a4326"/><ellipse cx="-8" cy="-4" rx="6" ry="4.6" fill="#8fa07a" ${ol}/><path d="M3 -2 H6 L7.4 2 Q7.4 6 4.5 6 Q1.6 6 1.6 2 Z" fill="#f3ecdc" ${ol}/>`
  },
  {
    // Jerusalem: the wall and the Temple
    dx: -6,
    dy: -17,
    s: 1.1,
    svg: `<rect x="-11" y="-1" width="22" height="7" fill="#a29679" ${ol}/><path d="M-11 -1 h3 v-2 h-3 z M-5 -1 h3 v-2 h-3 z M2 -1 h3 v-2 h-3 z M8 -1 h3 v-2 h-3 z" fill="#a29679" ${ol}/><path d="M-5 -1 Q0 -12 5 -1 Z" fill="#d9ad4a" ${ol}/><rect x="-.6" y="-15" width="1.2" height="5" fill="#d9ad4a"/>`
  }
];

// Which stop a landmark belongs to is its position in the list, the same order as STOPS.
export const landmarkFor = i => LANDMARKS[i] || null;
