import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { registerServiceWorker } from "./pwa.js";
import { listenForInstall } from "@/lib/install.js";
import { applyTheme } from "@/lib/theme.js";
import "./styles.css";
import "./theme-light.css";

applyTheme(); // before the first draw, so the page never flashes the other theme

listenForInstall();
createRoot(document.getElementById("root")).render(<App />);
registerServiceWorker();
