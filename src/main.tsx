import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QuickCaptureWindow } from "./components/capture/QuickCaptureWindow";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./styles.css";

// Kill macOS autocorrect/autocapitalize/spellcheck in every text field.
document.addEventListener("focusin", (event) => {
  const el = event.target;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.setAttribute("autocorrect", "off");
    el.setAttribute("autocomplete", "off");
    el.autocapitalize = "off";
    el.spellcheck = false;
  }
});

const Root = getCurrentWindow().label === "quick-capture" ? QuickCaptureWindow : App;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </React.StrictMode>,
);
