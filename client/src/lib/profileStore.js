import { useCallback, useEffect, useState } from "react";

export const DEFAULT_AVATAR_STYLE = "sunset-heart";
export const DEFAULT_AVATAR_FRAME = "none";

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

// Instagram-style frames drawn around the avatar / uploaded photo.
// (The actual drawing of each frame lives in ProfileAvatar.jsx -> FRAME_ART.)
export const AVATAR_FRAMES = [
  { id: "none", label: "No frame" },
  { id: "story", label: "Story ring" },
  { id: "live", label: "Live ring" },
  { id: "ember", label: "Ember" },
  { id: "neon", label: "Neon" },
  { id: "gold", label: "Gold" },
  { id: "rose", label: "Rose" },
  { id: "aurora", label: "Aurora" },
  { id: "double", label: "Double" },
  { id: "dashed", label: "Dashed" },
];

const AVATAR_STYLE_IDS = new Set(AVATAR_STYLES.map(({ id }) => id));
const AVATAR_FRAME_IDS = new Set(AVATAR_FRAMES.map(({ id }) => id));
const AVATAR_STYLE_CHANGE_EVENT = "inkloom:avatar-style-change";

// Saved value format (one string in localStorage, so Sidebar/Topbar need no changes):
//   "sunset-heart"                      -> avatar style, no frame
//   "data:image/jpeg;base64,..."        -> uploaded photo, no frame
//   "frame:story|sunset-heart"          -> avatar style + frame
//   "frame:gold|data:image/jpeg;..."    -> uploaded photo + frame
const FRAME_PREFIX = "frame:";
const CUSTOM_PHOTO_PATTERN = /^data:image\/(jpeg|png|webp);base64,/;

export function isCustomPhoto(value) {
  return typeof value === "string" && CUSTOM_PHOTO_PATTERN.test(value);
}

function isValidBase(value) {
  return AVATAR_STYLE_IDS.has(value) || isCustomPhoto(value);
}

function splitFramed(value) {
  if (typeof value !== "string" || !value.startsWith(FRAME_PREFIX)) return null;
  const separator = value.indexOf("|");
  if (separator === -1) return null;
  const frame = value.slice(FRAME_PREFIX.length, separator);
  const base = value.slice(separator + 1);
  if (!AVATAR_FRAME_IDS.has(frame) || !isValidBase(base)) return null;
  return { frame, base };
}

function isValidStyle(value) {
  return isValidBase(value) || splitFramed(value) !== null;
}

// "frame:story|sunset-heart" -> { base: "sunset-heart", frame: "story" }
export function parseAvatarValue(value) {
  const framed = splitFramed(value);
  if (framed) return framed;
  return {
    base: isValidBase(value) ? value : DEFAULT_AVATAR_STYLE,
    frame: DEFAULT_AVATAR_FRAME,
  };
}

// { base, frame } -> the single string that gets saved.
export function buildAvatarValue(base, frame) {
  const safeBase = isValidBase(base) ? base : DEFAULT_AVATAR_STYLE;
  if (!frame || frame === DEFAULT_AVATAR_FRAME || !AVATAR_FRAME_IDS.has(frame)) return safeBase;
  return `${FRAME_PREFIX}${frame}|${safeBase}`;
}

export function getInitial(name) {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  return Array.from(normalizedName)[0]?.toLocaleUpperCase() || "?";
}

function getStorageKey(userKey) {
  const normalizedKey = typeof userKey === "string" ? userKey.trim().toLowerCase() : "";
  return `inkloom-avatar-style:${normalizedKey || "guest"}`;
}

function readAvatarStyle(key) {
  const storedStyle = localStorage.getItem(key);
  return isValidStyle(storedStyle) ? storedStyle : DEFAULT_AVATAR_STYLE;
}

export function useAvatarStyle(userKey) {
  const storageKey = getStorageKey(userKey);
  const [savedStyle, setSavedStyle] = useState(() => ({
    key: storageKey,
    style: readAvatarStyle(storageKey),
  }));
  const style = savedStyle.key === storageKey ? savedStyle.style : readAvatarStyle(storageKey);

  useEffect(() => {
    if (savedStyle.key !== storageKey) {
      setSavedStyle({ key: storageKey, style: readAvatarStyle(storageKey) });
    }

    function handleStyleChange(event) {
      if (event.detail?.key === storageKey && isValidStyle(event.detail.style)) {
        setSavedStyle({ key: storageKey, style: event.detail.style });
      }
    }

    function handleStorageChange(event) {
      if (event.key === storageKey) {
        setSavedStyle({ key: storageKey, style: readAvatarStyle(storageKey) });
      }
    }

    window.addEventListener(AVATAR_STYLE_CHANGE_EVENT, handleStyleChange);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener(AVATAR_STYLE_CHANGE_EVENT, handleStyleChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [savedStyle.key, storageKey]);

  const saveStyle = useCallback((nextStyle) => {
    const validStyle = isValidStyle(nextStyle) ? nextStyle : DEFAULT_AVATAR_STYLE;
    try {
      localStorage.setItem(storageKey, validStyle);
    } catch {
      return; // storage full or blocked
    }
    setSavedStyle({ key: storageKey, style: validStyle });
    window.dispatchEvent(new CustomEvent(AVATAR_STYLE_CHANGE_EVENT, {
      detail: { key: storageKey, style: validStyle },
    }));
  }, [storageKey]);

  return [style, saveStyle];
}