// Stop scenes: a short illustrated banner for every stop on the journey, each with its own time of day and weather
// drawn from the story (a storm on the sea, noon at Jacob's well, a full moon at the Passover). They are plain SVG
// strings, 360 x 120, and the motion (rain, lightning, twinkling, waves) comes from classes in the stylesheet.

const SKY = {
  dawn: ["#6f86b8", "#f2b98b", "#fbe0ac"],
  day: ["#6fb4e3", "#bfe3f5", "#eaf6fb"],
  hot: ["#eaa85f", "#f6cf8b", "#fdeec4"],
  dusk: ["#37386b", "#c4616a", "#f6a45c"],
  night: ["#0a0f2c", "#1c2a5a", "#2f467f"],
  storm: ["#161b29", "#343d52", "#56627a"]
};
const GROUND = {
  dawn: "#8a6a4a",
  day: "#b79a5f",
  hot: "#cfa459",
  dusk: "#5a4236",
  night: "#1f2533",
  storm: "#222a36"
};
const FAR = {
  dawn: "#765a3f",
  day: "#9c8250",
  hot: "#b98f4c",
  dusk: "#4a362d",
  night: "#171c28",
  storm: "#1a212b"
};
const WATER = {
  dawn: "#6f8fb0",
  day: "#4f86a6",
  hot: "#5f93a8",
  dusk: "#3d4f78",
  night: "#14213f",
  storm: "#1d2b3a"
};
const SUN = { dawn: "#ffd9a0", day: "#fff3c2", hot: "#fff0b0", dusk: "#ffd08a" };
// a fixed scatter, so a night sky looks the same every time
const STARS = [
  [20, 14],
  [48, 30],
  [84, 10],
  [118, 24],
  [150, 8],
  [196, 18],
  [232, 10],
  [262, 28],
  [330, 12],
  [344, 36],
  [300, 8],
  [70, 46]
];

const person = (x, y, c) =>
  `<circle cx="${x}" cy="${y - 7}" r="2.6" fill="${c}"/><path d="M${x - 3} ${y} L${x - 2} ${
    y - 5
  } H${x + 2} L${x + 3} ${y} Z" fill="${c}"/>`;
const tree = (x, y, h, c = "#5f7a3a") =>
  `<rect x="${x - 1.4}" y="${y - h * 0.4}" width="2.8" height="${
    h * 0.4
  }" fill="#4a3421"/><ellipse cx="${x}" cy="${y - h * 0.62}" rx="${h * 0.34}" ry="${
    h * 0.3
  }" fill="${c}"/>`;
const palm = (x, y, h) =>
  `<path d="M${x} ${y} Q${x + 3} ${y - h / 2} ${x + 1} ${
    y - h
  }" fill="none" stroke="#5a4326" stroke-width="2.4" stroke-linecap="round"/>` +
  [-1, 1]
    .map(
      d =>
        `<path d="M${x + 1} ${y - h} q${d * 11} -3 ${d * 16} 8 M${x + 1} ${y - h} q${d * 12} -9 ${
          d * 17
        } -2 M${x + 1} ${y - h} q${d * 5} -11 ${
          d * 10
        } -9" fill="none" stroke="#4f7a34" stroke-width="2.2" stroke-linecap="round"/>`
    )
    .join("");
const house = (x, y, w, h, c = "#e7d6b0") =>
  `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${
    y - h
  }" width="${w}" height="2.4" fill="#cdb98c"/><rect x="${x + w / 2 - 2.4}" y="${
    y - 8
  }" width="4.8" height="8" fill="#5a4129"/>`;

// the scene for each stop, in the same order as STOPS
const SCENES = [
  {
    time: "night",
    label: "A bright star over Bethlehem at night",
    star: [236, 26],
    motif: () =>
      `<path d="M92 92 V72 L130 54 L168 72 V92 Z" fill="#6a4a30"/><path d="M86 74 L130 49 L174 74 Z" fill="#4d351f"/><rect x="120" y="76" width="20" height="16" fill="#ffcf70" class="sc-glow"/><ellipse cx="130" cy="91" rx="12" ry="3" fill="#d9b25a"/>` +
      person(260, 88, "#1c140e") +
      `<path d="M262 88 V70" stroke="#1c140e" stroke-width="1.3"/>` +
      `<ellipse cx="286" cy="90" rx="6" ry="3.6" fill="#eee6d4"/><ellipse cx="302" cy="91" rx="5.4" ry="3.2" fill="#eee6d4"/>`
  },
  {
    time: "day",
    label: "Morning over the houses of Nazareth",
    sun: [300, 26],
    motif: () =>
      house(54, 90, 26, 16) +
      house(92, 86, 24, 20, "#efe2c2") +
      house(128, 91, 28, 14) +
      house(166, 88, 22, 18, "#e2d0a6") +
      tree(250, 92, 30, "#6b7f45") +
      tree(276, 90, 24, "#6b7f45")
  },
  {
    time: "day",
    label: "The heavens open over the Jordan",
    water: true,
    rays: true,
    motif: () =>
      `<path d="M168 36 q4 -10 14 -7 q10 -6 12 5 q-8 6 -18 6 z" fill="#f6f2ea" stroke="#d8d2c2" stroke-width=".6"/><circle cx="194" cy="30" r="2.6" fill="#f6f2ea"/><path d="M196 29.4 l5 1.3 l-5 1.3z" fill="#e39a3a"/>` +
      `<path d="M30 92 v-22 M36 92 v-28 M42 92 v-20 M312 92 v-24 M318 92 v-30 M324 92 v-20" stroke="#5f7a3a" stroke-width="2.2" stroke-linecap="round"/>` +
      person(150, 96, "#3b2a1c") +
      person(206, 98, "#3b2a1c")
  },
  {
    time: "hot",
    label: "The heat of the wilderness at midday",
    sun: [90, 30, 16],
    heat: true,
    motif: () =>
      `<path d="M0 94 Q60 70 130 92 T270 90 T360 86 V120 H0Z" fill="#dcb872"/><path d="M150 98 Q240 74 360 96 V120 H150Z" fill="#c9a25c"/>` +
      `<ellipse cx="236" cy="96" rx="9" ry="5" fill="#8d877d"/><ellipse cx="252" cy="98" rx="6" ry="3.6" fill="#a39d92"/><ellipse cx="222" cy="99" rx="5" ry="3" fill="#7d776d"/>` +
      `<path d="M150 98 q-3 -10 -8 -14 M150 98 q1 -12 4 -17 M150 98 q5 -8 12 -10" fill="none" stroke="#6f6a3a" stroke-width="1.6" stroke-linecap="round"/>`
  },
  {
    time: "dusk",
    label: "Evening lamps at the wedding in Cana",
    sun: [316, 72],
    motif: () => {
      const jar = x =>
        `<path d="M${x - 7} 96 Q${x - 10} 82 ${x - 5} 76 L${x + 5} 76 Q${x + 10} 82 ${
          x + 7
        } 96 Z" fill="#a98f6a" stroke="#6f5c3e" stroke-width=".8"/><ellipse cx="${x}" cy="76" rx="5" ry="1.6" fill="#7a1f2c"/>`;
      return (
        `<path d="M0 36 Q90 58 180 36 T360 36" fill="none" stroke="#2a2018" stroke-width="1"/>` +
        [30, 90, 150, 210, 270, 330]
          .map(
            x =>
              `<circle cx="${x}" cy="${x % 180 ? 49 : 42}" r="3" fill="#ffd46a" class="sc-glow"/>`
          )
          .join("") +
        [96, 124, 152, 180, 208, 236].map(jar).join("")
      );
    }
  },
  {
    time: "dawn",
    label: "Dawn on the shore at Capernaum",
    water: true,
    sun: [58, 72],
    motif: () =>
      `<path d="M210 96 Q240 108 290 96 L282 86 H218 Z" fill="#6a4a30" stroke="#3b2a1c" stroke-width="1"/><path d="M250 86 V50 L274 84 Z" fill="#efe2c2"/><path d="M250 86 V50" stroke="#3b2a1c" stroke-width="1.4"/>` +
      `<path d="M104 92 V64 M132 92 V64" stroke="#4a3421" stroke-width="2"/><path d="M104 66 Q118 80 132 66 M104 74 Q118 88 132 74 M108 66 V80 M118 70 V84 M128 66 V80" fill="none" stroke="#8a7a58" stroke-width="1"/>`
  },
  {
    time: "storm",
    label: "A storm on the Sea of Galilee at night",
    water: true,
    weather: "storm",
    motif: () =>
      `<g class="sc-rock"><path d="M150 92 Q180 108 232 92 L224 80 H158 Z" fill="#5a3f28" stroke="#1a120c" stroke-width="1"/><path d="M190 80 V54" stroke="#1a120c" stroke-width="1.6"/><path d="M190 56 L176 78 H190 Z" fill="#cdbf9a" opacity=".85"/></g>` +
      `<path d="M0 100 q15 -14 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#a9c4d6" stroke-width="2" opacity=".6" class="sc-wave"/>`
  },
  {
    time: "day",
    label: "A grassy hillside at Bethsaida",
    sun: [296, 26],
    motif: () => {
      const cols = ["#7a3b2e", "#2d4a6b", "#8a6a2e", "#4a5a35", "#6a4a7a", "#a0522d"];
      let crowd = "";
      for (let r = 0; r < 3; r++) {
        for (let i = 0; i < 11; i++) {
          crowd += person(
            100 + i * 15 + (r % 2) * 7,
            88 + r * 8,
            cols[(i * 2 + r * 3) % cols.length]
          );
        }
      }
      return (
        `<path d="M0 104 Q40 100 70 90 Q140 62 230 74 Q310 84 360 100 V120 H0Z" fill="#8aa35a"/>` +
        crowd +
        `<path d="M16 108 L44 108 L40 118 L20 118 Z" fill="#b98a4b"/>` +
        [24, 32, 40]
          .map(x => `<ellipse cx="${x}" cy="105" rx="5" ry="3.4" fill="#d9a25a"/>`)
          .join("") +
        `<path d="M44 106 l8 -3 l-1 6 z" fill="#8fb3c9"/>`
      );
    }
  },
  {
    time: "day",
    label: "The cliffs below Mount Hermon at Caesarea Philippi",
    sun: [58, 26],
    motif: () =>
      `<path d="M120 96 L210 18 L300 96 Z" fill="#8d8a86"/><path d="M210 18 L236 42 L222 38 L210 52 L198 40 L186 44 Z" fill="#f4f6f8"/>` +
      `<path d="M60 100 V62 L110 54 V100 Z" fill="#a59b8a"/><path d="M76 100 V80 Q84 70 92 80 V100 Z" fill="#3b3128"/>` +
      `<path d="M92 100 Q140 108 190 100" fill="none" stroke="#7fb3d0" stroke-width="3" stroke-linecap="round"/>`
  },
  {
    time: "hot",
    label: "Noon at Jacob's well in Samaria",
    sun: [180, 20, 15],
    heat: true,
    motif: () =>
      `<path d="M152 96 V82 Q180 74 208 82 V96 Z" fill="#a39a8a" stroke="#6f6758" stroke-width="1"/><ellipse cx="180" cy="82" rx="28" ry="6" fill="#4a5a68"/>` +
      `<path d="M156 82 V58 M204 82 V58 M150 58 H210" stroke="#4a3421" stroke-width="2.4" stroke-linecap="round"/><path d="M180 58 V76" stroke="#c9b27a" stroke-width="1.2"/><path d="M175 76 h10 l-1.6 7 h-6.8 z" fill="#8a5e34"/>` +
      `<path d="M98 100 Q92 88 99 82 L109 82 Q116 88 110 100 Z" fill="#b5683a"/>`
  },
  {
    time: "day",
    label: "Palm trees and a sycamore at Jericho",
    sun: [304, 26],
    motif: () =>
      palm(60, 96, 46) +
      palm(98, 98, 38) +
      palm(318, 96, 44) +
      `<path d="M206 98 Q208 78 200 62 M206 98 Q210 80 220 66" fill="none" stroke="#5a4326" stroke-width="5" stroke-linecap="round"/><ellipse cx="210" cy="54" rx="40" ry="20" fill="#5f7a3a"/><ellipse cx="190" cy="62" rx="22" ry="12" fill="#6e8a45"/>` +
      person(213, 64, "#241a12") +
      person(150, 100, "#7a3b2e") +
      person(168, 102, "#2d4a6b")
  },
  {
    time: "dusk",
    label: "Dusk at the supper in Bethany",
    sun: [58, 78],
    motif: () =>
      house(186, 94, 66, 34, "#ead9b4") +
      `<rect x="200" y="70" width="12" height="12" fill="#ffcf70" class="sc-glow"/><rect x="226" y="70" width="12" height="12" fill="#ffcf70" class="sc-glow"/>` +
      tree(120, 96, 34, "#7f8f6a") +
      tree(150, 98, 28, "#7f8f6a") +
      tree(290, 96, 32, "#7f8f6a") +
      `<path d="M262 96 V86 H286 V96" fill="none" stroke="#4a3421" stroke-width="2"/><path d="M270 86 Q266 78 272 74 L278 74 Q284 78 280 86 Z" fill="#f3ecdc" stroke="#8a7a58" stroke-width=".8"/>`
  },
  {
    time: "night",
    label: "Passover night in Jerusalem under a full moon",
    moon: [300, 28],
    motif: () => {
      const merlons = Array.from({ length: 30 }, (_, i) => `M${i * 12} 62 h6 v-5 h-6z`).join(" ");
      return (
        `<rect x="0" y="62" width="360" height="36" fill="#6f6759"/><path d="${merlons}" fill="#6f6759"/>` +
        `<rect x="40" y="46" width="22" height="52" fill="#5f574a"/><rect x="300" y="46" width="22" height="52" fill="#5f574a"/>` +
        `<path d="M150 62 V44 Q180 22 210 44 V62 Z" fill="#d9ad4a"/><rect x="164" y="44" width="32" height="18" fill="#e7cf8a"/><rect x="178" y="14" width="4" height="12" fill="#d9ad4a"/>` +
        [90, 120, 244, 274, 100, 262]
          .map(
            (x, i) =>
              `<rect x="${x}" y="${
                i < 4 ? 72 : 82
              }" width="5" height="7" fill="#ffcf70" class="sc-glow"/>`
          )
          .join("")
      );
    }
  }
];

export const SCENE_COUNT = SCENES.length;

// { svg, label, time } for stop i. Ids are prefixed per stop so two scenes on a page never share one.
export function stopScene(i) {
  const s = SCENES[i];
  if (!s) {
    return { svg: "", label: "", time: "day" };
  }
  const id = `sc${i}`;
  const [c1, c2, c3] = SKY[s.time];
  let o =
    `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>` +
    `<radialGradient id="${id}-glow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>` +
    `<rect width="360" height="120" fill="url(#${id}-sky)"/>`;
  if (s.time === "night" || s.time === "storm") {
    o += STARS.map(
      ([x, y], k) =>
        `<circle cx="${x}" cy="${y}" r="${
          k % 3 ? 0.9 : 1.4
        }" fill="#fff" class="sc-twinkle" style="animation-delay:${(k % 5) * 0.6}s"/>`
    ).join("");
  }
  if (s.sun) {
    const [x, y, r = 11] = s.sun;
    o += `<circle cx="${x}" cy="${y}" r="${
      r * 2.6
    }" fill="url(#${id}-glow)" opacity=".6"/><circle cx="${x}" cy="${y}" r="${r}" fill="${
      SUN[s.time]
    }"/>`;
  }
  if (s.moon) {
    const [x, y] = s.moon;
    o += `<circle cx="${x}" cy="${y}" r="30" fill="url(#${id}-glow)" opacity=".35"/><circle cx="${x}" cy="${y}" r="12" fill="#f6f0d8"/><circle cx="${
      x - 3
    }" cy="${y - 2}" r="2.4" fill="#e3dcc0"/><circle cx="${x + 4}" cy="${
      y + 3
    }" r="1.8" fill="#e3dcc0"/>`;
  }
  if (s.star) {
    const [x, y] = s.star;
    const pts = [...Array(8)]
      .map((_, k) => {
        const a = ((-90 + k * 45) * Math.PI) / 180;
        const r = k % 2 ? 3 : 13;
        return `${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)}`;
      })
      .join(" L");
    o += `<circle cx="${x}" cy="${y}" r="34" fill="url(#${id}-glow)" opacity=".5" class="sc-glow"/><path d="M${pts} Z" fill="#fff6c8"/>`;
  }
  if (s.rays) {
    o += `<path d="M176 0 L190 0 L232 100 L134 100 Z" fill="#fff3c2" opacity=".28"/><path d="M180 0 L186 0 L206 100 L162 100 Z" fill="#fff8dc" opacity=".3"/>`;
  }
  if (s.weather === "storm") {
    o +=
      `<ellipse cx="70" cy="22" rx="70" ry="20" fill="#0f1420" opacity=".85"/><ellipse cx="180" cy="14" rx="90" ry="20" fill="#141a28" opacity=".9"/><ellipse cx="300" cy="24" rx="70" ry="22" fill="#0f1420" opacity=".85"/>` +
      `<path d="M212 22 L196 56 H208 L198 86 L224 46 H212 L222 22 Z" fill="#fff6c8" class="sc-bolt"/>`;
  }
  o += `<path d="M0 84 Q50 66 110 80 T230 76 T360 80 V120 H0Z" fill="${FAR[s.time]}"/>`;
  if (s.water) {
    o += `<rect y="86" width="360" height="34" fill="${WATER[s.time]}"/>`;
    o += `<path d="M0 96 q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" fill="none" stroke="#fff" stroke-width="1.2" opacity=".35" class="sc-wave"/>`;
  } else {
    o += `<path d="M0 92 Q60 82 120 90 T240 88 T360 90 V120 H0Z" fill="${GROUND[s.time]}"/>`;
  }
  o += s.motif();
  if (s.heat) {
    o += `<path d="M0 88 q30 -4 60 0 t60 0 t60 0 t60 0 t60 0 t60 0" fill="none" stroke="#fff" stroke-width="1" opacity=".3" class="sc-heat"/>`;
  }
  if (s.weather === "storm") {
    o += `<g class="sc-rain" stroke="#bcd0e0" stroke-width="1" opacity=".55">${Array.from(
      { length: 28 },
      (_, k) => `<path d="M${k * 13 + 4} ${(k * 17) % 90} l-3 9"/>`
    ).join("")}</g>`;
  }
  return {
    svg: `<svg viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${o}</svg>`,
    label: s.label,
    time: s.time
  };
}
