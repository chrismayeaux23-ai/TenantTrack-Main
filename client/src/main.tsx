import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics, captureUtmsFromUrl } from "./lib/analytics";

initAnalytics();
captureUtmsFromUrl();

createRoot(document.getElementById("root")!).render(<App />);
