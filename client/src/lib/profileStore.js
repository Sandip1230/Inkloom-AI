import { useCallback, useEffect, useState } from "react";

export const DEFAULT_AVATAR_STYLE = "sunset-heart";

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

const AVATAR_STYLE_IDS = new Set(AVATAR_STYLES.map(({ id }) => id));
const AVATAR_STYLE_CHANGE_EVENT = "inkloom:avatar-style-change";

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
  return AVATAR_STYLE_IDS.has(storedStyle) ? storedStyle : DEFAULT_AVATAR_STYLE;
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
      if (event.detail?.key === storageKey && AVATAR_STYLE_IDS.has(event.detail.style)) {
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
    const validStyle = AVATAR_STYLE_IDS.has(nextStyle) ? nextStyle : DEFAULT_AVATAR_STYLE;
    localStorage.setItem(storageKey, validStyle);
    setSavedStyle({ key: storageKey, style: validStyle });
    window.dispatchEvent(new CustomEvent(AVATAR_STYLE_CHANGE_EVENT, {
      detail: { key: storageKey, style: validStyle },
    }));
  }, [storageKey]);

  return [style, saveStyle];
}
