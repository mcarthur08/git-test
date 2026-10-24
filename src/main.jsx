import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { registerServiceWorker } from "./pwa.js";
import { listenForInstall } from "@/lib/install.js";
import "./styles.css";

listenForInstall();
createRoot(document.getElementById("root")).render(<App />);
registerServiceWorker();
