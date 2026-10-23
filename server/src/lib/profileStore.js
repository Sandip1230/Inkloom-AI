import { useCallback, useEffect, useState } from "react";

// The 15 avatar styles shown in the "Change profile photo" picker.
// Every style is drawn around the FIRST LETTER of the user's name.
export const AVATAR_STYLES = [
  { id: "sunset-heart", label: "Sunset heart" },
  { id: "leaf-noir", label: "Leaf noir" },
  { id: "blush-script", label: "Blush script" },
  { id: "eclipse", label: "Eclipse" },
  { id: "blossom", label: "Blossom" },
  { id: "aurora", label: "Aurora" },
  { id: "lilac", label: "Lilac" },
  { id: "brush-ring", label: "Brush ring" },
  { id: "lotus", label: "Lotus" },
  { id: "line-sprig", label: "Line sprig" },
  { id: "ink-sparkle", label: "Ink sparkle" },
  { id: "smoke", label: "Smoke" },
  { id: "rose-script", label: "Rose script" },
  { id: "crown", label: "Crown" },
  { id: "dusk", label: "Dusk" },
];

export const DEFAULT_AVATAR_STYLE = AVATAR_STYLES[0].id;

const KEY_PREFIX = "inkloom-avatar-style";
const CHANGE_EVENT = "inkloom-avatar-change";

function storageKey(userKey) {
  return `${KEY_PREFIX}:${String(userKey || "guest").toLowerCase()}`;
}

function isValidStyle(id) {
  return AVATAR_STYLES.some((style) => style.id === id);
}

// First letter of a name, upper-cased. Works for names that start with an
// emoji or an accented letter, and falls back to "G" (Guest).
export function getInitial(name) {
  const first = Array.from(String(name || "").trim())[0];
  return first ? first.toUpperCase() : "G";
}

export function getAvatarStyle(userKey) {
  try {
    const stored = localStorage.getItem(storageKey(userKey));
    return isValidStyle(stored) ? stored : DEFAULT_AVATAR_STYLE;
  } catch {
    return DEFAULT_AVATAR_STYLE;
  }
}

export function saveAvatarStyle(userKey, styleId) {
  if (!isValidStyle(styleId)) return;
  try {
    localStorage.setItem(storageKey(userKey), styleId);
  } catch {
    // Storage can be blocked (private mode). The change still applies for this session below.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { userKey, styleId } }));
}

// React hook: returns [styleId, setStyle]. Every component that uses it
// (sidebar, top bar) updates immediately when the style is changed anywhere.
export function useAvatarStyle(userKey) {
  const [style, setStyle] = useState(() => getAvatarStyle(userKey));

  useEffect(() => {
    setStyle(getAvatarStyle(userKey));
    function sync() {
      setStyle(getAvatarStyle(userKey));
    }
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [userKey]);

  const update = useCallback(
    (nextStyle) => {
      saveAvatarStyle(userKey, nextStyle);
      setStyle(isValidStyle(nextStyle) ? nextStyle : DEFAULT_AVATAR_STYLE);
    },
    [userKey],
  );

  return [style, update];
}