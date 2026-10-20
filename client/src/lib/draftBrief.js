// draftBrief.js — carries a template's brief text from the Templates page
// into a fresh Discover form, without needing a global store for it.

const KEY = "inkloom-draft-brief";
const LEGACY_KEY = "brandloom-draft-brief";

export function setDraftBrief(text) {
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    // ignore - worst case the template text just doesn't prefill
  }
}

export function consumeDraftBrief() {
  try {
    const value = sessionStorage.getItem(KEY) || sessionStorage.getItem(LEGACY_KEY) || "";
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(LEGACY_KEY);
    return value;
  } catch {
    return "";
  }
}