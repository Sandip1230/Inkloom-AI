import { useEffect, useRef, useState } from "react";

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

// Custom dropdown that replaces the browser's native <select>.
// options: [{ value, label }]   onChange receives the chosen value.
export default function InkSelect({
  value,
  onChange,
  options,
  ariaLabel,
  icon = null,
  small = false,
  wide = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const current = options.find((option) => option.value === value) || options[0];

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // When the menu opens, focus the selected option so arrow keys work.
  useEffect(() => {
    if (!open) return;
    const target = menuRef.current?.querySelector(".is-active") || menuRef.current?.querySelector('[role="option"]');
    target?.focus();
  }, [open]);

  function onButtonKeyDown(event) {
    if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(event) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll('[role="option"]') || []);
    if (!items.length) return;
    const index = items.indexOf(document.activeElement);
    const next = event.key === "ArrowDown"
      ? (index + 1) % items.length
      : (index - 1 + items.length) % items.length;
    items[next].focus();
  }

  return (
    <div className={`ink-dd ${small ? "ink-dd--small" : ""} ${wide ? "ink-dd--wide" : ""}`} ref={rootRef}>
      <button
        type="button"
        ref={buttonRef}
        className="ink-dd__btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((state) => !state)}
        onKeyDown={onButtonKeyDown}
      >
        {icon && <span className="ink-dd__icon">{icon}</span>}
        <span className="ink-dd__label">{current?.label}</span>
        <span className={`ink-dd__chev ${open ? "is-open" : ""}`}><ChevronIcon /></span>
      </button>

      {open && (
        <div className="ink-dd__menu" role="listbox" aria-label={ariaLabel} ref={menuRef} onKeyDown={onMenuKeyDown}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`ink-dd__opt ${option.value === value ? "is-active" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                buttonRef.current?.focus();
              }}
            >
              {option.label}
              {option.value === value && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}