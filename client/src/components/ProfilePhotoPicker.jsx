import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProfileAvatar from "./ProfileAvatar.jsx";
import { AVATAR_STYLES, getInitial } from "../lib/profileStore.js";

// Pop-up that lets the user choose one of 15 profile-photo styles.
// Each option is built from the first letter of the user's name.
export default function ProfilePhotoPicker({ open, name, currentStyle, onSave, onClose }) {
  const [selected, setSelected] = useState(currentStyle);
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Start from the saved style every time the pop-up opens.
  useEffect(() => {
    if (open) setSelected(currentStyle);
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
  const selectedMeta = AVATAR_STYLES.find((style) => style.id === selected);

  function handleArrowKeys(event) {
    const index = AVATAR_STYLES.findIndex((style) => style.id === selected);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % AVATAR_STYLES.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + AVATAR_STYLES.length) % AVATAR_STYLES.length;
    else if (event.key === "ArrowDown") next = Math.min(index + 5, AVATAR_STYLES.length - 1);
    else if (event.key === "ArrowUp") next = Math.max(index - 5, 0);
    else return;
    event.preventDefault();
    setSelected(AVATAR_STYLES[next].id);
    window.setTimeout(() => {
      dialogRef.current?.querySelector("[aria-checked='true']")?.focus();
    }, 0);
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
        <button type="button" className="pf-dialog__close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="pf-dialog__head">
          <ProfileAvatar name={name} styleId={selected} size={64} />
          <div>
            <h2 id="pf-dialog-title" className="pf-dialog__title">Change profile photo</h2>
            <p className="pf-dialog__sub">
              Pick a style for your letter “{initial}”. {selectedMeta ? `Selected: ${selectedMeta.label}.` : ""}
            </p>
          </div>
        </div>

        <div className="pf-grid" role="radiogroup" aria-label="Profile photo styles" onKeyDown={handleArrowKeys}>
          {AVATAR_STYLES.map((style) => {
            const active = style.id === selected;
            return (
              <button
                key={style.id}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={style.label}
                tabIndex={active ? 0 : -1}
                title={style.label}
                onClick={() => setSelected(style.id)}
                className={`pf-option ${active ? "is-active" : ""}`}
              >
                <ProfileAvatar name={name} styleId={style.id} size={76} title={style.label} />
              </button>
            );
          })}
        </div>

        <div className="pf-dialog__actions">
          <button type="button" className="pf-btn pf-btn--ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="pf-btn pf-btn--primary"
            onClick={() => { onSave(selected); onClose(); }}
          >
            Save photo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}