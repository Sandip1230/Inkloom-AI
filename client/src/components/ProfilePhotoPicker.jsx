import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProfileAvatar from "./ProfileAvatar.jsx";
import {
  AVATAR_FRAMES,
  AVATAR_STYLES,
  DEFAULT_AVATAR_STYLE,
  buildAvatarValue,
  getInitial,
  isCustomPhoto,
  parseAvatarValue,
} from "../lib/profileStore.js";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB
const OUTPUT_SIZE = 256;

// Styles for the upload row and the frame picker (kept here so no CSS file needs editing).
const PICKER_STYLES = `
  .pf-upload { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 16px; }
  .pf-upload__hint { font-size: 12px; color: #a79ea8; }
  .pf-upload__error { flex-basis: 100%; margin: 0; font-size: 12.5px; color: #ff8a8a; }

  .pf-frames { margin-top: 20px; }
  .pf-frames__title { margin: 0 0 10px; font-size: 13px; font-weight: 600; color: #e8e3ea; }
  .pf-frames__grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
  .pf-frame-option {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 10px 4px 8px; border: 1px solid transparent; border-radius: 14px;
    background: transparent; color: #b9afbb; font-size: 11px; font-weight: 500;
    cursor: pointer; transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  .pf-frame-option:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
  .pf-frame-option.is-active { border-color: #ff7a4c; background: rgba(255, 122, 76, 0.1); color: #fff; }
  .pf-frame-option:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  .pf-frame-option__label { line-height: 1.2; text-align: center; }

  @media (max-width: 520px) {
    .pf-frames__grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
`;

// Center-crops the picked image to a square and shrinks it, so it stays tiny in localStorage.
function fileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      const sx = (image.naturalWidth - side) / 2;
      const sy = (image.naturalHeight - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff"; // for transparent PNGs
      context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      context.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image"));
    };
    image.src = objectUrl;
  });
}

// Pop-up to choose an avatar style or upload your own photo,
// then pick an Instagram-style frame around it.
export default function ProfilePhotoPicker({ open, name, currentStyle, onSave, onClose }) {
  const [base, setBase] = useState(() => parseAvatarValue(currentStyle).base);
  const [frame, setFrame] = useState(() => parseAvatarValue(currentStyle).frame);
  const [uploadError, setUploadError] = useState("");
  const dialogRef = useRef(null);
  const fileInputRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Start from the saved avatar + frame every time the pop-up opens.
  useEffect(() => {
    if (open) {
      const parsed = parseAvatarValue(currentStyle);
      setBase(parsed.base);
      setFrame(parsed.frame);
      setUploadError("");
    }
  }, [open, currentStyle]);

  // Esc closes, Tab stays inside the pop-up, page behind does not scroll.
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector("[aria-checked='true']")?.focus();
    }, 30);

    function handleKey(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll("button:not([disabled])");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  if (!open) return null;

  const initial = getInitial(name);
  const selectedMeta = AVATAR_STYLES.find((style) => style.id === base);
  const frameMeta = AVATAR_FRAMES.find((item) => item.id === frame);
  const hasCustomPhoto = isCustomPhoto(base);
  const previewValue = buildAvatarValue(base, frame);

  function handleArrowKeys(event) {
    const index = Math.max(0, AVATAR_STYLES.findIndex((style) => style.id === base));
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % AVATAR_STYLES.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + AVATAR_STYLES.length) % AVATAR_STYLES.length;
    else if (event.key === "ArrowDown") next = Math.min(index + 5, AVATAR_STYLES.length - 1);
    else if (event.key === "ArrowUp") next = Math.max(index - 5, 0);
    else return;
    event.preventDefault();
    setBase(AVATAR_STYLES[next].id);
    window.setTimeout(() => {
      dialogRef.current?.querySelector(".pf-grid [aria-checked='true']")?.focus();
    }, 0);
  }

  function handleFrameKeys(event) {
    const index = Math.max(0, AVATAR_FRAMES.findIndex((item) => item.id === frame));
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % AVATAR_FRAMES.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + AVATAR_FRAMES.length) % AVATAR_FRAMES.length;
    else return;
    event.preventDefault();
    setFrame(AVATAR_FRAMES[next].id);
    window.setTimeout(() => {
      dialogRef.current?.querySelector(".pf-frames [aria-checked='true']")?.focus();
    }, 0);
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file (JPG, PNG or WEBP).");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("That image is too large. Choose one under 8 MB.");
      return;
    }
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setBase(dataUrl);
      setUploadError("");
    } catch {
      setUploadError("Could not read that image. Try a JPG, PNG or WEBP file.");
    }
  }

  return createPortal(
    <div className="pf-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={dialogRef}
        className="pf-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pf-dialog-title"
      >
        <style>{PICKER_STYLES}</style>

        <button type="button" className="pf-dialog__close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="pf-dialog__head">
          <ProfileAvatar name={name} styleId={previewValue} size={72} />
          <div>
            <h2 id="pf-dialog-title" className="pf-dialog__title">Change profile photo</h2>
            <p className="pf-dialog__sub">
              {hasCustomPhoto
                ? "Using your uploaded photo."
                : `Pick a style for your letter “${initial}”. ${selectedMeta ? `Selected: ${selectedMeta.label}.` : ""}`}
              {frameMeta && frame !== "none" ? ` Frame: ${frameMeta.label}.` : ""}
            </p>
          </div>
        </div>

        <div className="pf-grid" role="radiogroup" aria-label="Profile photo styles" onKeyDown={handleArrowKeys}>
          {AVATAR_STYLES.map((style) => {
            const active = style.id === base;
            return (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={style.label}
                tabIndex={active || (!selectedMeta && style.id === DEFAULT_AVATAR_STYLE) ? 0 : -1}
                title={style.label}
                onClick={() => setBase(style.id)}
                className={`pf-option ${active ? "is-active" : ""}`}
              >
                <ProfileAvatar name={name} styleId={style.id} size={76} title={style.label} />
              </button>
            );
          })}
        </div>

        <div className="pf-upload">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            hidden
          />
          <button type="button" className="pf-btn pf-btn--ghost" onClick={() => fileInputRef.current?.click()}>
            {hasCustomPhoto ? "Change photo" : "Upload your photo"}
          </button>
          {hasCustomPhoto && (
            <button type="button" className="pf-btn pf-btn--ghost" onClick={() => setBase(DEFAULT_AVATAR_STYLE)}>
              Remove photo
            </button>
          )}
          <span className="pf-upload__hint">JPG, PNG or WEBP, up to 8 MB</span>
          {uploadError && <p role="alert" className="pf-upload__error">{uploadError}</p>}
        </div>

        <div className="pf-frames">
          <p className="pf-frames__title" id="pf-frames-title">Frame</p>
          <div className="pf-frames__grid" role="radiogroup" aria-labelledby="pf-frames-title" onKeyDown={handleFrameKeys}>
            {AVATAR_FRAMES.map((item) => {
              const active = item.id === frame;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={`${item.label} frame`}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setFrame(item.id)}
                  className={`pf-frame-option ${active ? "is-active" : ""}`}
                >
                  <ProfileAvatar name={name} styleId={buildAvatarValue(base, item.id)} size={52} title={item.label} />
                  <span className="pf-frame-option__label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pf-dialog__actions">
          <button type="button" className="pf-btn pf-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="pf-btn pf-btn--primary"
            onClick={() => { onSave(previewValue); onClose(); }}
          >
            Save photo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}