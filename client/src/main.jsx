// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./styles/index.css";

// ---------- Text selection control ----------
// Input, textarea, pre (AI output) ar .selectable chhara baki kono text select/copy hobe na.
const ALLOWED = 'input, textarea, pre, code, [contenteditable="true"], .selectable';

const selectionStyle = document.createElement("style");
selectionStyle.setAttribute("data-selection-control", "true");
selectionStyle.textContent = `
  body, body * {
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    user-select: none !important;
    -webkit-touch-callout: none;
  }
  body input,
  body textarea,
  body pre,
  body code,
  body [contenteditable="true"],
  body .selectable,
  body .selectable * {
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    user-select: text !important;
  }
`;
document.head.appendChild(selectionStyle);

function toElement(node) {
  if (!node) return null;
  return node instanceof Element ? node : node.parentElement;
}

function isAllowed(node) {
  const el = toElement(node);
  return Boolean(el && el.closest(ALLOWED));
}

// Mouse drag / Ctrl+A diye select shuru-i hote debe na
document.addEventListener("selectstart", (event) => {
  if (!isAllowed(event.target)) event.preventDefault();
});

// Kono bhabe select hoye gele-o copy block
document.addEventListener("copy", (event) => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  if (!isAllowed(selection.anchorNode) || !isAllowed(selection.focusNode)) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);